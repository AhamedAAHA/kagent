import { FamilyMember, Product } from '@/types';

export interface MemoryContext {
  familyMembers: FamilyMember[];
  purchaseHistory: { productId: string; name: string; date: string }[];
}

const RELATIONSHIP_PATTERNS: [RegExp, string][] = [
  [/\bamma\b|mother|mummy|mama\b/i, 'Mother'],
  [/\bappa\b|father|thatha|dad\b/i, 'Father'],
  [/\bakka\b|sister|nangi\b/i, 'Sister'],
  [/\bmalli\b|brother|ayya\b/i, 'Brother'],
  [/\bwife\b|nona\b|partner\b/i, 'Partner'],
  [/\bhusband\b|mama\b/i, 'Husband'],
  [/\bfriend\b|yaluwa\b/i, 'Friend'],
  [/\bcolleague\b|office\b|team\b/i, 'Colleague'],
];

const PREFERENCE_PATTERNS: [RegExp, string][] = [
  [/rosa|roses|rose\b|ros\s*mal/i, 'roses'],
  [/chocolate|චොකලට්/i, 'chocolate'],
  [/cake|කේක්/i, 'cake'],
  [/hamper|gift\s*box/i, 'gift hamper'],
  [/flowers|mal\b|මල්/i, 'flowers'],
  [/coffee|tea\b/i, 'coffee & tea'],
  [/surprise/i, 'surprise gifts'],
];

function generateId(): string {
  return `fm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Extract or update family member hints from a user message. */
export function learnFromMessage(
  message: string,
  existing: FamilyMember[],
): FamilyMember[] {
  const lower = message.toLowerCase();
  const members = [...existing];
  const prefs = PREFERENCE_PATTERNS.filter(([re]) => re.test(message)).map(([, p]) => p);

  for (const [pattern, relationship] of RELATIONSHIP_PATTERNS) {
    if (!pattern.test(lower) && !pattern.test(message)) continue;

    const nameMatch = message.match(
      /(?:for|to|ge|ගේ|ekata|ekak)\s+([A-Za-z\u0D80-\u0DFF]{2,20})/i,
    );
    const name = nameMatch?.[1] ?? relationship;

    const idx = members.findIndex(
      m => m.relationship === relationship || m.name.toLowerCase() === name.toLowerCase(),
    );

    if (idx >= 0) {
      const m = members[idx];
      members[idx] = {
        ...m,
        preferences: [...new Set([...m.preferences, ...prefs])].slice(0, 8),
      };
    } else if (prefs.length > 0 || relationship !== 'Friend') {
      members.push({
        id: generateId(),
        name,
        relationship,
        preferences: prefs,
        pastGifts: [],
      });
    }
    break;
  }

  return members.slice(0, 12);
}

/** Build search tag boosts from stored memory. */
export function memorySearchBoosts(ctx: MemoryContext, userMessage: string): string[] {
  const boosts: string[] = [];
  const lower = userMessage.toLowerCase();

  for (const member of ctx.familyMembers) {
    const nameHit = lower.includes(member.name.toLowerCase());
    const relHit = RELATIONSHIP_PATTERNS.some(
      ([re, rel]) => rel === member.relationship && (re.test(lower) || re.test(userMessage)),
    );
    if (nameHit || relHit) {
      boosts.push(...member.preferences);
      if (member.relationship === 'Mother') boosts.push('mother gift', 'roses');
      if (member.relationship === 'Father') boosts.push('father gift');
    }
  }

  for (const p of ctx.purchaseHistory.slice(-5)) {
    const words = p.name.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    boosts.push(...words.slice(0, 2));
  }

  return [...new Set(boosts)].slice(0, 8);
}

/** Re-rank products using purchase history — deprioritise recently bought items. */
export function applyMemoryToProducts(
  products: Product[],
  ctx: MemoryContext,
): Product[] {
  const recentIds = new Set(ctx.purchaseHistory.slice(-8).map(p => p.productId));
  const preferredTags = new Set(
    ctx.familyMembers.flatMap(m => m.preferences.map(p => p.toLowerCase())),
  );

  const scored = products.map(p => {
    let score = 0;
    if (recentIds.has(p.id) || recentIds.has(p.kaprukaId ?? '')) score -= 30;
    for (const tag of preferredTags) {
      if (p.tags.some(t => t.includes(tag) || tag.includes(t))) score += 15;
      if (p.name.toLowerCase().includes(tag)) score += 10;
    }
    if (p.source === 'kapruka') score += 5;
    if (p.image?.startsWith('http')) score += 3;
    return { product: p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.product);
}

export interface MemoryInsight {
  logLines: string[];
  summary: string;
  debateLine: string;
  promptBlock: string;
}

/** Produce real memory-agent logs and LLM context from stored data. */
export function buildMemoryInsight(
  ctx: MemoryContext,
  userMessage: string,
  messageCount: number,
): MemoryInsight {
  const logLines: string[] = [];
  const boosts = memorySearchBoosts(ctx, userMessage);

  if (ctx.familyMembers.length > 0) {
    const names = ctx.familyMembers
      .slice(0, 4)
      .map(m => `${m.name} (${m.relationship}${m.preferences.length ? `: ${m.preferences.slice(0, 2).join(', ')}` : ''})`)
      .join('; ');
    logLines.push(`Family on file: ${names}`);
  } else {
    logLines.push('No family profiles yet — learning from this message');
  }

  if (ctx.purchaseHistory.length > 0) {
    const recent = ctx.purchaseHistory.slice(-3).map(p => p.name).join(', ');
    logLines.push(`Recent purchases: ${recent}`);
    logLines.push('Avoiding repeat gifts from last 8 orders');
  } else {
    logLines.push('No purchase history — fresh recommendations');
  }

  if (boosts.length > 0) {
    logLines.push(`Preference boost: ${boosts.join(', ')}`);
  }

  logLines.push(`Conversation #${messageCount} — profile updating`);

  const summary = ctx.familyMembers.length > 0
    ? `Personalised for ${ctx.familyMembers.length} saved contact(s)${ctx.purchaseHistory.length ? `, ${ctx.purchaseHistory.length} past orders` : ''}`
    : `Session ${messageCount} — building your shopper profile`;

  let debateLine = 'No prior history — recommending popular Kapruka picks.';
  if (ctx.purchaseHistory.length > 0 && ctx.familyMembers.length > 0) {
    const member = ctx.familyMembers[0];
    const last = ctx.purchaseHistory[ctx.purchaseHistory.length - 1];
    debateLine = `Remember ${member.name} prefers ${member.preferences[0] ?? 'quality gifts'}. Last order was ${last.name} — suggesting something fresh.`;
  } else if (ctx.familyMembers.length > 0) {
    const member = ctx.familyMembers[0];
    debateLine = `${member.name} (${member.relationship}) on file — favouring ${member.preferences.join(', ') || 'thoughtful gifts'}.`;
  } else if (ctx.purchaseHistory.length > 0) {
    debateLine = `Based on ${ctx.purchaseHistory.length} past orders — balancing familiarity with variety.`;
  }

  const promptBlock = [
    ctx.familyMembers.length > 0
      ? `Saved family: ${ctx.familyMembers.map(m => `${m.name} (${m.relationship}, likes: ${m.preferences.join('/') || 'gifts'})`).join('; ')}`
      : '',
    ctx.purchaseHistory.length > 0
      ? `Recent orders (avoid exact repeats): ${ctx.purchaseHistory.slice(-5).map(p => p.name).join(', ')}`
      : '',
    boosts.length > 0 ? `Preference signals this turn: ${boosts.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return { logLines, summary, debateLine, promptBlock };
}
