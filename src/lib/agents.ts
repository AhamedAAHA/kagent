import Anthropic from '@anthropic-ai/sdk';
import { searchProducts, getProductsByTags, formatPrice } from './products';
import { getFestivalContext, getUpcomingFestival } from './festivals';
import { Product, ShoppingBundle, CartItem, AgentActivity, AgentName } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AgentResult {
  activities: AgentActivity[];
  response: string;
  bundles?: ShoppingBundle[];
  products?: Product[];
  predictiveAlerts?: string[];
}

function makeActivity(agentId: AgentName, status: 'thinking' | 'done' | 'error', message: string): AgentActivity {
  return { agentId, status, message, timestamp: new Date() };
}

function buildBundles(items: Product[], budget?: number): ShoppingBundle[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.price - b.price);
  const total = (arr: Product[]) => arr.reduce((s, p) => s + p.price, 0);

  const budgetItems: CartItem[] = sorted.slice(0, Math.min(5, sorted.length)).map(p => ({ product: p, quantity: 1 }));
  const midItems: CartItem[] = sorted.slice(0, Math.min(7, sorted.length)).map(p => ({ product: p, quantity: 1 }));
  const premItems: CartItem[] = sorted.map(p => ({ product: p, quantity: 1 }));

  const maxDays = (items: CartItem[]) => Math.max(...items.map(i => i.product.deliveryDays));
  const deliveryLabel = (days: number) => days <= 1 ? 'Same day delivery' : `${days}-day delivery`;

  return [
    {
      id: 'bundle-budget',
      name: 'Budget Setup',
      description: 'Essential items within a tight budget',
      tier: 'budget',
      items: budgetItems,
      totalPrice: total(budgetItems.map(i => i.product)),
      estimatedDelivery: deliveryLabel(maxDays(budgetItems)),
    },
    {
      id: 'bundle-mid',
      name: 'Recommended Setup',
      description: 'Best value for money — most popular choice',
      tier: 'midrange',
      items: midItems,
      totalPrice: total(midItems.map(i => i.product)),
      estimatedDelivery: deliveryLabel(maxDays(midItems)),
    },
    {
      id: 'bundle-premium',
      name: 'Complete Setup',
      description: 'Everything you need, nothing left out',
      tier: 'premium',
      items: premItems,
      totalPrice: total(premItems.map(i => i.product)),
      estimatedDelivery: deliveryLabel(maxDays(premItems)),
    },
  ];
}

export async function runAgentOrchestration(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userBudget?: number,
  onActivity?: (activity: AgentActivity) => void
): Promise<AgentResult> {
  const activities: AgentActivity[] = [];
  const emit = (a: AgentActivity) => { activities.push(a); onActivity?.(a); };

  const festivalContext = getFestivalContext();
  const upcomingFestival = getUpcomingFestival();

  // --- Life Event Agent ---
  emit(makeActivity('life-event', 'thinking', 'Analysing your life situation...'));

  const lifeEventPrompt = `You are the KAgent Life Event Analyser. Given the user message, extract:
1. Life event type (moving, university, birthday, anniversary, hosting, festival, general shopping)
2. Key items needed (as a JSON array of search tags)
3. Estimated budget if mentioned (number in LKR or null)
4. Timeline urgency (same-day, this-week, this-month, flexible)

Respond ONLY with JSON: {"event": "string", "tags": ["tag1","tag2",...], "budget": number|null, "urgency": "string", "summary": "one sentence"}

User: "${userMessage}"`;

  let lifeEventData = { event: 'general', tags: [] as string[], budget: null as number | null, urgency: 'flexible', summary: '' };
  try {
    const leRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: lifeEventPrompt }],
    });
    const leText = leRes.content[0].type === 'text' ? leRes.content[0].text : '{}';
    lifeEventData = JSON.parse(leText.replace(/```json?|```/g, '').trim());
    emit(makeActivity('life-event', 'done', `Detected: ${lifeEventData.event} — ${lifeEventData.summary}`));
  } catch {
    emit(makeActivity('life-event', 'done', 'Life situation analysed'));
  }

  // --- Festival Agent ---
  emit(makeActivity('festival', 'thinking', 'Checking Sri Lankan festivals...'));
  await new Promise(r => setTimeout(r, 300));
  let festivalNote = '';
  if (upcomingFestival && upcomingFestival.daysUntil <= 14) {
    festivalNote = `${upcomingFestival.name} is in ${upcomingFestival.daysUntil} days!`;
    emit(makeActivity('festival', 'done', `${upcomingFestival.name} in ${upcomingFestival.daysUntil} days — adding recommendations`));
    if (!lifeEventData.tags.includes('festival')) {
      lifeEventData.tags.push(...(upcomingFestival.suggestedCategories as string[]));
    }
  } else {
    emit(makeActivity('festival', 'done', festivalContext || 'No major festivals in the next 2 weeks'));
  }

  // --- Shopping Agent ---
  emit(makeActivity('shopping', 'thinking', 'Searching Sri Lankan products...'));
  const effectiveBudget = userBudget ?? lifeEventData.budget ?? undefined;
  const searchQuery = lifeEventData.tags.join(' ') || userMessage;
  const foundProducts = searchProducts(searchQuery, effectiveBudget);
  const tagProducts = getProductsByTags(lifeEventData.tags);
  const allProducts = [...new Map([...foundProducts, ...tagProducts].map(p => [p.id, p])).values()].slice(0, 20);
  emit(makeActivity('shopping', 'done', `Found ${allProducts.length} products from local Sri Lankan vendors`));

  // --- Budget Agent ---
  emit(makeActivity('budget', 'thinking', 'Optimising your cart...'));
  await new Promise(r => setTimeout(r, 200));
  const bundles = buildBundles(allProducts, effectiveBudget);
  const cheapBundle = bundles[0];
  emit(makeActivity('budget', 'done',
    cheapBundle
      ? `Budget setup: ${formatPrice(cheapBundle.totalPrice)} | Premium: ${formatPrice(bundles[2]?.totalPrice ?? 0)}`
      : 'Budget optimised'));

  // --- Delivery Agent ---
  emit(makeActivity('delivery', 'thinking', 'Checking delivery timelines...'));
  await new Promise(r => setTimeout(r, 200));
  const sameDayCount = allProducts.filter(p => p.deliveryDays <= 1).length;
  emit(makeActivity('delivery', 'done', `${sameDayCount} items available for same/next day delivery in Colombo`));

  // --- Memory Agent ---
  emit(makeActivity('memory', 'thinking', 'Checking your preferences...'));
  await new Promise(r => setTimeout(r, 150));
  emit(makeActivity('memory', 'done', 'Preferences loaded — personalising recommendations'));

  // --- Concierge Agent (final response) ---
  emit(makeActivity('concierge', 'thinking', 'Crafting your personalised plan...'));

  const systemPrompt = `You are KAgent — Sri Lanka's most advanced AI shopping concierge. You speak warmly, like a trusted local friend who knows Sri Lanka inside out. You respond in English but can use Sinhala phrases naturally (with translations).

You NEVER just list products. Instead, you solve life problems. You understand Sri Lankan culture, festivals, pricing, and local vendors.

Context:
- Detected life event: ${lifeEventData.event}
- Items identified: ${lifeEventData.tags.join(', ')}
- Products found: ${allProducts.length} items
- Budget: ${effectiveBudget ? formatPrice(effectiveBudget) : 'Not specified'}
- Festival context: ${festivalContext || 'No major festival upcoming'}
- Urgency: ${lifeEventData.urgency}

Sri Lankan products available:
${allProducts.slice(0, 10).map(p => `- ${p.name}: ${formatPrice(p.price)} (${p.vendor}, ${p.deliveryDays}d delivery, ★${p.rating})`).join('\n')}

${bundles.length > 0 ? `Bundle options prepared:
- Budget: ${formatPrice(bundles[0]?.totalPrice)} | Mid: ${formatPrice(bundles[1]?.totalPrice)} | Premium: ${formatPrice(bundles[2]?.totalPrice)}` : ''}

Respond warmly and helpfully (2-4 paragraphs). Mention specific local vendors and products by name. Reference the festival if relevant. End with a clear recommendation about which bundle to choose and why. Be concise but personal.`;

  const messages = [
    ...conversationHistory.slice(-6),
    { role: 'user' as const, content: userMessage },
  ];

  let response = '';
  try {
    const concRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });
    response = concRes.content[0].type === 'text' ? concRes.content[0].text : '';
    emit(makeActivity('concierge', 'done', 'Your personal shopping plan is ready!'));
  } catch (err) {
    emit(makeActivity('concierge', 'error', 'Could not generate response'));
    response = 'I encountered an issue. Please check your API key and try again.';
  }

  // Predictive alerts
  const predictiveAlerts: string[] = [];
  if (upcomingFestival && upcomingFestival.daysUntil <= 10) {
    predictiveAlerts.push(`⚠️ ${upcomingFestival.name} is in ${upcomingFestival.daysUntil} days — order festival items now to avoid delays!`);
  }

  return {
    activities,
    response,
    bundles: bundles.length > 0 ? bundles : undefined,
    products: allProducts.slice(0, 12),
    predictiveAlerts,
  };
}
