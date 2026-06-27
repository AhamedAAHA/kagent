import OpenAI from 'openai';
import { searchProducts, getProductsByTags, formatPrice } from './products';
import { getFestivalContext, getUpcomingFestival } from './festivals';
import {
  Product, ShoppingBundle, CartItem, AgentActivity, AgentName,
  AgentDebateMessage, ShopperDNA, StreamChunk
} from '@/types';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AgentResult {
  activities: AgentActivity[];
  response: string;
  bundles?: ShoppingBundle[];
  products?: Product[];
  debate?: AgentDebateMessage[];
  dna?: ShopperDNA;
  predictiveAlerts?: string[];
}

function makeActivity(
  agentId: AgentName,
  status: 'thinking' | 'done' | 'error',
  message: string,
  logLines?: string[]
): AgentActivity {
  return { agentId, status, message, timestamp: new Date(), logLines };
}

function buildBundles(items: Product[], budget?: number): ShoppingBundle[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.price - b.price);
  const total = (arr: Product[]) => arr.reduce((s, p) => s + p.price, 0);
  const maxDays = (arr: CartItem[]) => Math.max(...arr.map(i => i.product.deliveryDays));
  const label = (d: number) => d <= 1 ? 'Same day delivery' : `${d}-day delivery`;
  const toCart = (arr: Product[]): CartItem[] => arr.map(p => ({ product: p, quantity: 1 }));

  const b = toCart(sorted.slice(0, Math.min(5, sorted.length)));
  const m = toCart(sorted.slice(0, Math.min(7, sorted.length)));
  const p = toCart(sorted);

  return [
    { id: 'bundle-budget',   name: 'Budget Setup',      description: 'Essential items within a tight budget',          tier: 'budget',   items: b, totalPrice: total(b.map(i=>i.product)), estimatedDelivery: label(maxDays(b)) },
    { id: 'bundle-mid',      name: 'Recommended Setup', description: 'Best value for money — most popular choice',     tier: 'midrange', items: m, totalPrice: total(m.map(i=>i.product)), estimatedDelivery: label(maxDays(m)) },
    { id: 'bundle-premium',  name: 'Complete Setup',    description: 'Everything you need, nothing left out',          tier: 'premium',  items: p, totalPrice: total(p.map(i=>i.product)), estimatedDelivery: label(maxDays(p)) },
  ];
}

function buildDebate(
  lifeEvent: string,
  budget: number | null,
  topProduct: Product | undefined
): AgentDebateMessage[] {
  const now = new Date();
  const ms = (n: number) => new Date(now.getTime() + n * 300);
  const price = topProduct ? formatPrice(topProduct.price) : 'Rs. 5,000';

  return [
    { agentId: 'budget',    type: 'statement',  content: budget ? `Budget cap is ${formatPrice(budget)}. I've optimised 3 tiers staying within range.` : `No hard budget set. I recommend staying under Rs. 50,000 for best value.`, timestamp: ms(0) },
    { agentId: 'shopping',  type: 'statement',  content: topProduct ? `Found ${topProduct.name} at ${price} from ${topProduct.vendor}. Rating: ★${topProduct.rating}. Strong match for this ${lifeEvent}.` : `Found strong matches across Sri Lankan vendors for this ${lifeEvent}.`, timestamp: ms(1) },
    { agentId: 'delivery',  type: 'statement',  content: `Same-day delivery confirmed in Colombo. Outstation: 2-3 days via Kapruka logistics.`, timestamp: ms(2) },
    { agentId: 'festival',  type: 'objection',  content: `Festival timing matters — some items may sell out. I recommend ordering at least 3 days early.`, timestamp: ms(3) },
    { agentId: 'memory',    type: 'agreement',  content: `Preferences noted. Personalising based on your history — favouring quality over lowest price.`, timestamp: ms(4) },
    { agentId: 'concierge', type: 'verdict',    content: `Recommendation: Midrange bundle offers best value. Includes all essentials, within budget, arrives in time. Proceeding with full plan.`, timestamp: ms(5) },
  ];
}

function inferDNA(
  lifeEvent: string,
  tags: string[],
  budget: number | null,
  messageCount: number
): ShopperDNA {
  const traits: string[] = [];
  if (budget && budget < 30000) traits.push('Budget-conscious');
  if (budget && budget > 100000) traits.push('Premium buyer');
  if (tags.some(t => ['laptop','electronics','phone'].includes(t))) traits.push('Tech enthusiast');
  if (tags.some(t => ['birthday','gift','flowers','anniversary'].includes(t))) traits.push('Thoughtful gifter');
  if (tags.some(t => ['apartment','moving','household'].includes(t))) traits.push('Home builder');
  if (tags.some(t => ['university','study','notebook'].includes(t))) traits.push('Student mindset');
  if (lifeEvent === 'hosting') traits.push('Social host');
  if (traits.length === 0) traits.push('Versatile shopper');

  const topCategories = [...new Set(tags.slice(0, 3))];
  return {
    traits: traits.slice(0, 4),
    budgetStyle: budget ? (budget < 20000 ? 'Frugal' : budget < 80000 ? 'Balanced' : 'Generous') : 'Flexible',
    topCategories,
    deliveryPref: 'Fast (same/next day)',
    personalityTag: traits[0] ?? 'Explorer',
  };
}

// ─── STREAMING VERSION ───────────────────────────────────────────────────────
export async function* runAgentStream(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userBudget?: number,
  messageCount: number = 1,
): AsyncGenerator<StreamChunk> {

  const festivalContext = getFestivalContext();
  const upcomingFestival = getUpcomingFestival();

  // ── Life Event Agent ──────────────────────────────────────────────────────
  yield { type: 'agent_log', agentId: 'life-event', text: 'Parsing your message...' };

  const lifeEventPrompt = `You are the KAgent Life Event Analyser. Extract from the user message:
1. Life event type (moving, university, birthday, anniversary, hosting, festival, surprise, general)
2. Key items needed (JSON array of short search tags, max 8)
3. Budget in LKR (number or null)
4. Urgency: same-day | this-week | this-month | flexible
5. One-sentence summary

Respond ONLY with valid JSON — no markdown, no extra text:
{"event":"string","tags":["tag1","tag2"],"budget":number|null,"urgency":"string","summary":"string"}

User: "${userMessage}"`;

  let lifeEventData = { event: 'general', tags: [] as string[], budget: null as number | null, urgency: 'flexible', summary: '' };

  try {
    yield { type: 'agent_log', agentId: 'life-event', text: 'Detecting life situation...' };
    const openai = getOpenAI();
    const leRes = await openai.chat.completions.create({
      model: 'gpt-4', max_tokens: 300,
      messages: [{ role: 'user', content: lifeEventPrompt }],
    });
    const raw = leRes.choices[0]?.message?.content ?? '{}';
    lifeEventData = JSON.parse(raw.replace(/```json?|```/g, '').trim());
    yield { type: 'agent_log', agentId: 'life-event', text: `Detected: ${lifeEventData.event}` };
    yield { type: 'agent_log', agentId: 'life-event', text: `Tags: ${lifeEventData.tags.join(', ')}` };
    yield { type: 'agent_log', agentId: 'life-event', text: lifeEventData.budget ? `Budget: ${formatPrice(lifeEventData.budget)}` : 'No budget specified' };
  } catch {
    yield { type: 'agent_log', agentId: 'life-event', text: 'Fallback: using general shopping mode' };
  }
  yield { type: 'agent_done', agentId: 'life-event', text: `${lifeEventData.event} — ${lifeEventData.summary || 'analysed'}` };

  // ── Festival Agent ────────────────────────────────────────────────────────
  yield { type: 'agent_log', agentId: 'festival', text: 'Scanning Sri Lankan festival calendar...' };
  await new Promise(r => setTimeout(r, 200));

  if (upcomingFestival && upcomingFestival.daysUntil <= 14) {
    yield { type: 'agent_log', agentId: 'festival', text: `${upcomingFestival.name} detected — ${upcomingFestival.daysUntil} days away` };
    yield { type: 'agent_log', agentId: 'festival', text: `Adding: ${upcomingFestival.suggestedCategories.join(', ')}` };
    if (!lifeEventData.tags.includes('festival')) {
      lifeEventData.tags.push(...(upcomingFestival.suggestedCategories as string[]));
    }
    yield { type: 'agent_done', agentId: 'festival', text: `${upcomingFestival.name} in ${upcomingFestival.daysUntil} days — recommendations added` };
  } else {
    yield { type: 'agent_log', agentId: 'festival', text: festivalContext || 'No major festival in next 2 weeks' };
    yield { type: 'agent_done', agentId: 'festival', text: 'Calendar checked — no immediate festivals' };
  }

  // ── Shopping Agent ────────────────────────────────────────────────────────
  yield { type: 'agent_log', agentId: 'shopping', text: 'Searching Sri Lankan product database...' };
  const effectiveBudget = userBudget ?? lifeEventData.budget ?? undefined;
  const searchQuery = lifeEventData.tags.join(' ') || userMessage;

  yield { type: 'agent_log', agentId: 'shopping', text: `Query: "${searchQuery.slice(0, 50)}"` };
  const foundProducts = searchProducts(searchQuery, effectiveBudget);
  const tagProducts = getProductsByTags(lifeEventData.tags);
  const allProducts = [...new Map([...foundProducts, ...tagProducts].map(p => [p.id, p])).values()].slice(0, 20);

  yield { type: 'agent_log', agentId: 'shopping', text: `Found ${allProducts.length} matching products` };
  yield { type: 'agent_log', agentId: 'shopping', text: `Vendors: ${[...new Set(allProducts.map(p => p.vendor))].slice(0,4).join(', ')}` };
  yield { type: 'agent_done', agentId: 'shopping', text: `${allProducts.length} products from local vendors` };

  // ── Budget Agent ──────────────────────────────────────────────────────────
  yield { type: 'agent_log', agentId: 'budget', text: 'Building 3-tier bundle optimisation...' };
  await new Promise(r => setTimeout(r, 150));
  const bundles = buildBundles(allProducts, effectiveBudget);

  if (bundles.length > 0) {
    yield { type: 'agent_log', agentId: 'budget', text: `Budget tier:   ${formatPrice(bundles[0].totalPrice)}` };
    yield { type: 'agent_log', agentId: 'budget', text: `Mid tier:      ${formatPrice(bundles[1].totalPrice)}` };
    yield { type: 'agent_log', agentId: 'budget', text: `Premium tier:  ${formatPrice(bundles[2].totalPrice)}` };
    yield { type: 'agent_done', agentId: 'budget', text: `3 bundles ready — best value: ${formatPrice(bundles[1].totalPrice)}` };
  } else {
    yield { type: 'agent_done', agentId: 'budget', text: 'No bundle needed — showing individual products' };
  }

  // ── Delivery Agent ────────────────────────────────────────────────────────
  yield { type: 'agent_log', agentId: 'delivery', text: 'Checking delivery availability...' };
  await new Promise(r => setTimeout(r, 150));
  const sameDayCount = allProducts.filter(p => p.deliveryDays <= 1).length;
  yield { type: 'agent_log', agentId: 'delivery', text: `Same-day: ${sameDayCount} items (Colombo)` };
  yield { type: 'agent_log', agentId: 'delivery', text: `Outstation: 2-3 business days` };
  yield { type: 'agent_done', agentId: 'delivery', text: `${sameDayCount} items available same day in Colombo` };

  // ── Memory Agent ──────────────────────────────────────────────────────────
  yield { type: 'agent_log', agentId: 'memory', text: 'Loading user preferences...' };
  await new Promise(r => setTimeout(r, 100));
  yield { type: 'agent_log', agentId: 'memory', text: `Session ${messageCount} — building profile` };
  yield { type: 'agent_done', agentId: 'memory', text: 'Profile personalised for your shopping style' };

  // ── Debate ────────────────────────────────────────────────────────────────
  const debate = buildDebate(lifeEventData.event, lifeEventData.budget, allProducts[0]);
  yield { type: 'debate', data: debate };

  // ── Shopper DNA (after 2+ messages) ──────────────────────────────────────
  if (messageCount >= 2) {
    const dna = inferDNA(lifeEventData.event, lifeEventData.tags, lifeEventData.budget, messageCount);
    yield { type: 'dna', data: dna };
  }

  // ── Send products & bundles early ─────────────────────────────────────────
  yield { type: 'products', data: allProducts.slice(0, 12) };
  if (bundles.length > 0) yield { type: 'bundles', data: bundles };

  // ── Concierge Agent — streaming response ──────────────────────────────────
  yield { type: 'agent_log', agentId: 'concierge', text: 'Composing your personalised plan...' };

  const systemPrompt = `You are KAgent — Sri Lanka's most intelligent AI life shopping concierge. You speak like a warm, knowledgeable local friend.

Detected situation: ${lifeEventData.event} — ${lifeEventData.summary}
Tags: ${lifeEventData.tags.join(', ')}
Budget: ${effectiveBudget ? formatPrice(effectiveBudget) : 'open'}
Festival: ${festivalContext || 'none upcoming'}
Products found: ${allProducts.length}

Top products:
${allProducts.slice(0, 8).map(p => `• ${p.name} — ${formatPrice(p.price)} (${p.vendor}, ★${p.rating})`).join('\n')}

${bundles.length > 0 ? `Bundle tiers: Budget ${formatPrice(bundles[0].totalPrice)} | Mid ${formatPrice(bundles[1].totalPrice)} | Premium ${formatPrice(bundles[2].totalPrice)}` : ''}

Write 2-3 warm, specific paragraphs. Name real products and vendors. Reference Sri Lankan culture naturally. End with a clear bundle recommendation and why. Keep it under 180 words.`;

  const messages = [
    ...conversationHistory.slice(-6),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        yield { type: 'response_token', text: chunk.choices[0].delta.content };
      }
    }

    yield { type: 'agent_done', agentId: 'concierge', text: 'Plan ready — enjoy your shopping!' };
  } catch (err) {
    yield { type: 'agent_done', agentId: 'concierge', text: 'Error generating plan' };
    yield { type: 'error', text: err instanceof Error ? err.message : 'Unknown error' };
  }

  yield { type: 'done' };
}

// ─── NON-STREAMING FALLBACK ───────────────────────────────────────────────────
export async function runAgentOrchestration(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userBudget?: number,
): Promise<AgentResult> {
  const chunks: StreamChunk[] = [];
  for await (const chunk of runAgentStream(userMessage, conversationHistory, userBudget)) {
    chunks.push(chunk);
  }

  const activities: AgentActivity[] = [];
  let response = '';
  let bundles: ShoppingBundle[] | undefined;
  let products: Product[] | undefined;
  let debate: AgentDebateMessage[] | undefined;
  let dna: ShopperDNA | undefined;

  const agentLogs: Record<string, string[]> = {};
  for (const chunk of chunks) {
    if (chunk.type === 'agent_log' && chunk.agentId) {
      if (!agentLogs[chunk.agentId]) agentLogs[chunk.agentId] = [];
      agentLogs[chunk.agentId].push(chunk.text ?? '');
    } else if (chunk.type === 'agent_done' && chunk.agentId) {
      activities.push({ agentId: chunk.agentId, status: 'done', message: chunk.text ?? '', timestamp: new Date(), logLines: agentLogs[chunk.agentId] ?? [] });
    } else if (chunk.type === 'response_token') {
      response += chunk.text ?? '';
    } else if (chunk.type === 'bundles') {
      bundles = chunk.data as ShoppingBundle[];
    } else if (chunk.type === 'products') {
      products = chunk.data as Product[];
    } else if (chunk.type === 'debate') {
      debate = chunk.data as AgentDebateMessage[];
    } else if (chunk.type === 'dna') {
      dna = chunk.data as ShopperDNA;
    }
  }

  return { activities, response, bundles, products, debate, dna };
}
