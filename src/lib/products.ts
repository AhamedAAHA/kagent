import { Product } from '@/types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'any', 'can', 'need', 'want', 'get', 'help', 'find',
  'please', 'rs', 'lkr', 'budget', 'next', 'month', 'week', 'year', 'day', 'days', 'im', "i'm",
  'everything', 'anything', 'something', 'going', 'am', 'new', 'also', 'really', 'much', 'many',
]);

/** Keyword → search tags when the life-event LLM call fails or returns empty tags */
export const LIFE_EVENT_KEYWORDS: Record<string, string[]> = {
  moving: ['moving', 'apartment', 'mattress', 'fan', 'curtains', 'cleaning', 'kitchen', 'bedroom', 'electrical', 'cooking'],
  university: ['university', 'study', 'laptop', 'backpack', 'notebook', 'pen', 'calculator', 'water', 'table'],
  birthday: ['birthday', 'gift', 'flowers', 'chocolate', 'cake', 'card', 'mother', 'anniversary'],
  hosting: ['hosting', 'party', 'plates', 'drinks', 'kottu', 'ice', 'napkins', 'cake', 'event'],
  festival: ['festival', 'avurudu', 'vesak', 'gift', 'traditional', 'sweets'],
  surprise: ['gift', 'chocolate', 'coffee', 'speaker', 'hamper', 'sweet', 'gaming', 'music', 'nescafe'],
  redeploy: ['laptop', 'keyboard', 'mouse', 'coffee', 'study', 'work'],
  general: [],
};

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const WORD_SCALES: Record<string, number> = {
  hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, million: 1000000,
};

/** Parse "150,000", "Rs. 150000", or "one hundred fifty thousand" */
export function parseBudgetFromMessage(message: string): number | null {
  const lower = message.toLowerCase();

  const numeric =
    lower.match(/(?:rs\.?|lkr)\s*([\d,]+)/i) ??
    lower.match(/budget\s*(?:of\s*)?(?:rs\.?\s*)?([\d,]+)/i);
  if (numeric) {
    const n = parseInt(numeric[1].replace(/,/g, ''), 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }

  const written = lower.match(/budget\s+(?:of\s+)?(.+?)(?:\s+rupees?|\s+lkr|\s+rs)?$/i);
  if (!written) return null;

  const words = written[1].replace(/-/g, ' ').replace(/,/g, '').trim().split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;

  for (const word of words) {
    if (word in WORD_NUMBERS) {
      current += WORD_NUMBERS[word];
    } else if (word === 'hundred') {
      current = (current || 1) * 100;
    } else if (word in WORD_SCALES) {
      current = (current || 1) * WORD_SCALES[word];
      total += current;
      current = 0;
    }
  }

  const result = total + current;
  return result > 0 ? result : null;
}

export const SPECIFIC_LIFE_EVENTS = new Set([
  'moving', 'university', 'birthday', 'hosting', 'surprise', 'redeploy', 'festival',
]);

export function extractSearchTerms(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .replace(/rs\.?\s*[\d,]+/gi, '')
      .replace(/[^\w\s-]/g, ' ')
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 3 && !STOP_WORDS.has(t)),
  )];
}

function productSearchText(p: Product): string {
  return [p.name, p.nameSinhala, p.category, p.subcategory, ...p.tags].join(' ').toLowerCase();
}

function scoreProduct(p: Product, terms: string[]): number {
  if (terms.length === 0) return 0;
  const text = productSearchText(p);
  let score = 0;
  for (const term of terms) {
    if (p.tags.some(t => t === term || t.includes(term) || term.includes(t))) score += 12;
    if (p.category === term || p.subcategory === term) score += 10;
    if (p.name.toLowerCase().includes(term)) score += 8;
    if (text.includes(term)) score += 4;
  }
  score += p.rating * 0.5;
  return score;
}

export function inferLifeEventFromMessage(message: string): {
  event: string;
  tags: string[];
  budget: number | null;
  urgency: string;
  summary: string;
} {
  const lower = message.toLowerCase();
  const budget = parseBudgetFromMessage(message);

  const rules: { event: string; patterns: RegExp[] }[] = [
    { event: 'moving', patterns: [/mov(ing|e)/, /apartment/, /new home/, /relocate/, /gasa\s*yana/, /නව\s*ගෙ/, /ගෙය\s*යන/] },
    { event: 'university', patterns: [/universit/, /uni\s+setup/, /college/, /starting\s+uni/, /varsity/, /uni\s*yanawa/] },
    { event: 'birthday', patterns: [/birthday/, /bday/, /mother'?s?\s+birthday/, /anniversary/, /උපන්\s*දින/, /upadin/, /birthday\s*ekat/, /amma\s*ge/, /nangi\s*ge/, /akka\s*ge/] },
    { event: 'hosting', patterns: [/hosting/, /host\s+\d+/, /party/, /guests?/, /people\s+this/, /සාදය/] },
    { event: 'festival', patterns: [/avurudu/, /vesak/, /deepavali/, /christmas/, /eid/, /festival/, /අවුරුද්ද/, /වෙසක්/] },
    { event: 'surprise', patterns: [/surprise\s+me/, /gaming\s+night/, /coffee\s+lover/, /movie\s+night/, /wellness\s+kit/, /mystery\s+box/, /sri lankan vibes/, /denna\s*oni/, /gift\s*ekak/] },
    { event: 'redeploy', patterns: [/redeploy/, /deploy(ment|ing)?/] },
  ];

  let event = 'general';
  for (const rule of rules) {
    if (rule.patterns.some(p => p.test(lower))) {
      event = rule.event;
      break;
    }
  }

  const keywordTags = LIFE_EVENT_KEYWORDS[event] ?? [];
  const messageTerms = extractSearchTerms(message);
  const tags = [...new Set([...keywordTags, ...messageTerms])].slice(0, 10);

  const summaries: Record<string, string> = {
    moving: 'Setting up a new home in Sri Lanka',
    university: 'Getting ready for university',
    birthday: 'Finding the perfect birthday gift',
    hosting: 'Preparing to host guests',
    festival: 'Shopping for an upcoming festival',
    surprise: 'Curating a surprise gift pack',
    redeploy: 'Getting geared up for a project redeploy',
    general: 'Building a personalised shopping plan',
  };

  const sinhalaSummaries: Record<string, string> = {
    moving: 'නව නිවසක් සකස් කිරීමට උදව්',
    university: 'විශ්වවිද්‍යාලයට සූදානම් වෙමු',
    birthday: 'හොඳම උපන්දින තෑගිය සොයමු',
    hosting: 'ආගන්තුකයින් සඳහා සූදානම්',
    festival: 'උත්සවයක් සඳහා සාප්පු සවාරි',
    surprise: 'පුදුම තෑගි පැකේජයක්',
    redeploy: 'නව project redeploy එකට සූදානම්',
    general: 'ඔබට ගැලපෙන සාප්පු සැලසුම',
  };

  const tanglishSummaries: Record<string, string> = {
    moving: 'Nawa ge ekata oni de tika hoyaganna',
    university: 'Uni yanawa — oni de tika pack ekak',
    birthday: 'Birthday ekata perfect gift ekak hoyaganna',
    hosting: 'Party/hosting ekata oni de tika',
    festival: 'Festival ekata shopping plan ekak',
    surprise: 'Surprise gift pack ekak',
    redeploy: 'Redeploy ekata workspace setup',
    general: 'Oyaṭa match wena shopping plan ekak',
  };

  const isSinhala = /[\u0D80-\u0DFF]/.test(message);
  const isTanglish = !isSinhala && /\b(amma|mama|ekak|ekata|denna|oni|rosa|mal\b|birthday\s*ekat)\b/i.test(message);
  const summary = isSinhala
    ? (sinhalaSummaries[event] ?? sinhalaSummaries.general)
    : isTanglish
      ? (tanglishSummaries[event] ?? tanglishSummaries.general)
      : (summaries[event] ?? summaries.general);

  return {
    event,
    tags,
    budget,
    urgency: 'flexible' as const,
    summary,
  };
}

export const SRI_LANKA_PRODUCTS: Product[] = [
  // Food & Groceries
  { id: 'f001', name: 'Anchor Full Cream Milk Powder 400g', nameSinhala: 'ඇංකර් කිරිපිටි', price: 890, category: 'groceries', subcategory: 'dairy', image: '/products/milk-powder.jpg', vendor: 'Cargills Food City', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['dairy', 'milk', 'breakfast'], rating: 4.5, reviewCount: 234 },
  { id: 'f002', name: 'Maliban Cream Crackers 200g', nameSinhala: 'මාලිබාන් ක්‍රීම් ක්‍රැකර්ස්', price: 185, category: 'groceries', subcategory: 'biscuits', image: '/products/crackers.jpg', vendor: 'Keells Super', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['snack', 'biscuit', 'tea-time'], rating: 4.3, reviewCount: 189 },
  { id: 'f003', name: 'Dilmah Premium Ceylon Tea 100 bags', nameSinhala: 'දිල්මා සිලෝන් තේ', price: 650, category: 'groceries', subcategory: 'beverages', image: '/products/dilmah-tea.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['tea', 'ceylon', 'beverage', 'gift'], rating: 4.8, reviewCount: 512 },
  { id: 'f004', name: 'Elephant House Ice Cream 750ml', nameSinhala: 'අලි ගෙය අයිස්ක්‍රීම්', price: 420, category: 'food', subcategory: 'frozen', image: '/products/ice-cream.jpg', vendor: 'Elephant House', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['dessert', 'icecream', 'party'], rating: 4.6, reviewCount: 321 },
  { id: 'f005', name: 'Astra Margarine 500g', price: 275, category: 'groceries', subcategory: 'cooking', image: '/products/astra.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['cooking', 'baking'], rating: 4.1, reviewCount: 98 },
  { id: 'f006', name: 'MD Coconut Milk 400ml', nameSinhala: 'MD පොල් කිරි', price: 195, category: 'groceries', subcategory: 'cooking', image: '/products/coconut-milk.jpg', vendor: 'MD', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['cooking', 'sri-lankan', 'curry'], rating: 4.7, reviewCount: 445 },
  { id: 'f007', name: 'Harischandra Basmati Rice 5kg', nameSinhala: 'හරිශ්චන්ද්‍ර බාස්මතී සහල්', price: 1850, category: 'groceries', subcategory: 'rice', image: '/products/basmati.jpg', vendor: 'Harischandra', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['rice', 'staple', 'cooking'], rating: 4.4, reviewCount: 267 },
  { id: 'f008', name: 'Avurudu Sweet Box (Kevum, Kokis, Aluwa)', nameSinhala: 'ආවුරුදු කෑම පෙට්ටිය', price: 2500, category: 'festival', subcategory: 'sweets', image: '/products/avurudu-sweets.jpg', vendor: 'Laksala', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['avurudu', 'festival', 'gift', 'sweets', 'traditional'], rating: 4.9, reviewCount: 88 },

  // Electronics
  { id: 'e001', name: 'Abans 32" LED TV', nameSinhala: 'අබාන්ස් LED TV', price: 34900, category: 'electronics', subcategory: 'television', image: '/products/led-tv.jpg', vendor: 'Abans', location: 'Colombo', inStock: true, deliveryDays: 3, tags: ['tv', 'entertainment', 'living-room'], rating: 4.2, reviewCount: 145 },
  { id: 'e002', name: 'Samsung Galaxy A15 128GB', price: 49900, category: 'electronics', subcategory: 'smartphone', image: '/products/galaxy-a15.jpg', vendor: 'Dialog Axiata', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['phone', 'smartphone', 'samsung'], rating: 4.4, reviewCount: 231 },
  { id: 'e003', name: 'Lenovo IdeaPad 15 Laptop (i3, 8GB, 256GB SSD)', price: 115000, category: 'electronics', subcategory: 'laptop', image: '/products/lenovo-laptop.jpg', vendor: 'ICTC', location: 'Colombo', inStock: true, deliveryDays: 3, tags: ['laptop', 'computer', 'study', 'work', 'university'], rating: 4.3, reviewCount: 189 },
  { id: 'e004', name: 'Panasonic Table Fan 16"', nameSinhala: 'පැනසොනික් මේස රිය', price: 3800, category: 'electronics', subcategory: 'appliances', image: '/products/table-fan.jpg', vendor: 'Softlogic', location: 'Nationwide', inStock: true, deliveryDays: 2, tags: ['fan', 'cooling', 'home', 'apartment'], rating: 4.1, reviewCount: 312 },
  { id: 'e005', name: 'Philips Rice Cooker 1.8L', nameSinhala: 'පිලිප්ස් බත් කළ', price: 8500, category: 'electronics', subcategory: 'appliances', image: '/products/rice-cooker.jpg', vendor: 'Abans', location: 'Nationwide', inStock: true, deliveryDays: 2, tags: ['kitchen', 'cooking', 'apartment', 'moving'], rating: 4.6, reviewCount: 428 },
  { id: 'e006', name: 'JBL Go 3 Bluetooth Speaker', price: 5500, category: 'electronics', subcategory: 'audio', image: '/products/jbl-go.jpg', vendor: 'Softlogic', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['speaker', 'bluetooth', 'music', 'gift', 'gaming'], rating: 4.5, reviewCount: 167 },
  { id: 'e007', name: 'Logitech Wireless Mouse & Keyboard Combo', price: 4200, category: 'electronics', subcategory: 'accessories', image: '/products/logitech-combo.jpg', vendor: 'PC World', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['keyboard', 'mouse', 'computer', 'work', 'study', 'university'], rating: 4.4, reviewCount: 203 },
  { id: 'e008', name: 'Extension Cord 6-Socket 3m', price: 1200, category: 'electronics', subcategory: 'accessories', image: '/products/extension-cord.jpg', vendor: 'Hardware Zone', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['electrical', 'home', 'apartment', 'moving'], rating: 4.0, reviewCount: 445 },

  // Household
  { id: 'h001', name: 'Single Bed Mattress (5ft x 3ft, Spring)', nameSinhala: 'ඇඳ මෑට්ටෑස්', price: 18500, category: 'household', subcategory: 'bedroom', image: '/products/mattress.jpg', vendor: 'Duvora', location: 'Colombo', inStock: true, deliveryDays: 5, tags: ['bed', 'sleep', 'apartment', 'moving', 'bedroom'], rating: 4.3, reviewCount: 156 },
  { id: 'h002', name: 'Curtains Set (2 panels, 5ft)', nameSinhala: 'තිර', price: 2800, category: 'household', subcategory: 'decor', image: '/products/curtains.jpg', vendor: 'Singer', location: 'Colombo', inStock: true, deliveryDays: 3, tags: ['curtains', 'decor', 'apartment', 'moving'], rating: 4.1, reviewCount: 89 },
  { id: 'h003', name: 'Cleaning Supplies Starter Kit (Mop, Broom, Dustpan)', price: 1950, category: 'household', subcategory: 'cleaning', image: '/products/cleaning-kit.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['cleaning', 'apartment', 'moving', 'home'], rating: 4.2, reviewCount: 234 },
  { id: 'h004', name: 'Pillow Pack of 2 (Standard)', price: 1600, category: 'household', subcategory: 'bedroom', image: '/products/pillows.jpg', vendor: 'Duvora', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['pillow', 'sleep', 'bedroom', 'moving'], rating: 4.4, reviewCount: 178 },
  { id: 'h005', name: 'Dining Set (4 plates, 4 cups, 4 bowls)', price: 3200, category: 'household', subcategory: 'kitchen', image: '/products/dining-set.jpg', vendor: 'Softlogic', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['kitchen', 'dining', 'apartment', 'moving', 'hosting'], rating: 4.3, reviewCount: 112 },
  { id: 'h006', name: 'Bathroom Organizer Set', price: 1100, category: 'household', subcategory: 'bathroom', image: '/products/bathroom-set.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['bathroom', 'apartment', 'moving', 'organizer'], rating: 4.0, reviewCount: 67 },
  { id: 'h007', name: 'Folding Study Table', price: 5800, category: 'household', subcategory: 'furniture', image: '/products/study-table.jpg', vendor: 'Damro', location: 'Nationwide', inStock: true, deliveryDays: 4, tags: ['table', 'study', 'university', 'apartment', 'moving'], rating: 4.2, reviewCount: 145 },
  { id: 'h008', name: 'Pots & Pans Starter Set (3 pots)', nameSinhala: 'හෑළි කට්ටලය', price: 4500, category: 'household', subcategory: 'kitchen', image: '/products/pots.jpg', vendor: 'Damro', location: 'Nationwide', inStock: true, deliveryDays: 2, tags: ['cooking', 'kitchen', 'apartment', 'moving'], rating: 4.5, reviewCount: 321 },

  // Gifts & Flowers
  { id: 'g001', name: 'Red Rose Bouquet (12 stems)', nameSinhala: 'රතු රෝස කළඹ', price: 2800, category: 'gifts', subcategory: 'flowers', image: '/products/roses.jpg', vendor: 'Flora Garden', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['flowers', 'roses', 'birthday', 'anniversary', 'love', 'gift'], rating: 4.7, reviewCount: 289 },
  { id: 'g002', name: 'Mixed Lily Bouquet (6 stems)', nameSinhala: 'ලිලි මල් කළඹ', price: 3200, category: 'gifts', subcategory: 'flowers', image: '/products/lilies.jpg', vendor: 'Flora Garden', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['flowers', 'lilies', 'birthday', 'mother', 'gift'], rating: 4.8, reviewCount: 156 },
  { id: 'g003', name: 'Lotus Flower Arrangement (Vesak)', nameSinhala: 'නෙළුම් මල්', price: 1500, category: 'gifts', subcategory: 'flowers', image: '/products/lotus.jpg', vendor: 'Temple Flowers', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['flowers', 'vesak', 'poya', 'religious', 'festival'], rating: 4.6, reviewCount: 88 },
  { id: 'g004', name: 'Chocolate Gift Box (Assorted)', price: 1950, category: 'gifts', subcategory: 'chocolate', image: '/products/chocolates.jpg', vendor: 'Lassana Flora', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['chocolate', 'birthday', 'anniversary', 'gift', 'sweet'], rating: 4.5, reviewCount: 412 },
  { id: 'g005', name: 'Sri Lankan Spice Gift Hamper', nameSinhala: 'සිලෝන් කුළු බඩු ඇසිරිය', price: 3500, category: 'gifts', subcategory: 'hamper', image: '/products/spice-hamper.jpg', vendor: 'Laksala', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['spices', 'gift', 'hamper', 'sri-lankan', 'souvenir'], rating: 4.9, reviewCount: 234 },
  { id: 'g006', name: 'Handmade Batik Sarong', nameSinhala: 'ඇඳුම් සළුව', price: 1800, category: 'gifts', subcategory: 'clothing', image: '/products/batik-sarong.jpg', vendor: 'Laksala', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['batik', 'gift', 'traditional', 'clothing', 'avurudu'], rating: 4.7, reviewCount: 167 },
  { id: 'g007', name: 'Greeting Card + Personalized Message', price: 350, category: 'gifts', subcategory: 'stationery', image: '/products/card.jpg', vendor: 'Paper Chase', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['card', 'birthday', 'anniversary', 'gift'], rating: 4.3, reviewCount: 78 },

  // Stationery & University
  { id: 's001', name: 'A4 Notebook Pack (5 books)', price: 475, category: 'stationery', subcategory: 'notebooks', image: '/products/notebooks.jpg', vendor: 'Vijitha Yapa', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['notebook', 'study', 'university', 'stationery'], rating: 4.2, reviewCount: 445 },
  { id: 's002', name: 'Pen Set + Highlighters (12 pcs)', price: 320, category: 'stationery', subcategory: 'pens', image: '/products/pens.jpg', vendor: 'Bookland', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['pen', 'highlighter', 'study', 'university', 'stationery'], rating: 4.4, reviewCount: 312 },
  { id: 's003', name: 'Backpack (Laptop compartment, 30L)', price: 4200, category: 'stationery', subcategory: 'bags', image: '/products/backpack.jpg', vendor: 'Sports Zone', location: 'Nationwide', inStock: true, deliveryDays: 2, tags: ['bag', 'backpack', 'university', 'laptop', 'study'], rating: 4.5, reviewCount: 267 },
  { id: 's004', name: 'Stainless Steel Water Bottle 750ml', price: 890, category: 'stationery', subcategory: 'accessories', image: '/products/water-bottle.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['bottle', 'water', 'university', 'health', 'eco'], rating: 4.6, reviewCount: 189 },
  { id: 's005', name: 'Scientific Calculator (Casio FX-991)', price: 3800, category: 'stationery', subcategory: 'accessories', image: '/products/calculator.jpg', vendor: 'Softlogic', location: 'Nationwide', inStock: true, deliveryDays: 2, tags: ['calculator', 'study', 'university', 'maths', 'science'], rating: 4.8, reviewCount: 523 },

  // Hosting / Party
  { id: 'p001', name: 'Paper Plates Pack (50 pcs)', price: 450, category: 'household', subcategory: 'party', image: '/products/plates.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['party', 'hosting', 'plates', 'event'], rating: 4.0, reviewCount: 134 },
  { id: 'p002', name: 'Napkins Pack (100 pcs)', price: 280, category: 'household', subcategory: 'party', image: '/products/napkins.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['party', 'hosting', 'napkins', 'event'], rating: 4.1, reviewCount: 89 },
  { id: 'p003', name: 'Coca-Cola Party Pack (12 x 330ml)', price: 1560, category: 'food', subcategory: 'beverages', image: '/products/coke-pack.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['drinks', 'party', 'hosting', 'beverages', 'event'], rating: 4.5, reviewCount: 312 },
  { id: 'p004', name: 'Sprite Party Pack (12 x 330ml)', price: 1560, category: 'food', subcategory: 'beverages', image: '/products/sprite-pack.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['drinks', 'party', 'hosting', 'beverages', 'event'], rating: 4.4, reviewCount: 178 },
  { id: 'p005', name: 'Birthday Cake (1kg, custom message)', nameSinhala: 'උපන් දින කේක්', price: 3500, category: 'food', subcategory: 'cake', image: '/products/cake.jpg', vendor: 'Perera & Sons', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['cake', 'birthday', 'party', 'celebration'], rating: 4.8, reviewCount: 445 },
  { id: 'p006', name: 'Kottu Roti Catering (25 portions)', nameSinhala: 'කොත්තු රොටී', price: 8750, category: 'food', subcategory: 'catering', image: '/products/kottu.jpg', vendor: 'Hotel Renuka Catering', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['food', 'kottu', 'catering', 'hosting', 'party', 'event'], rating: 4.7, reviewCount: 89 },
  { id: 'p007', name: 'Ice Pack (10kg bag)', price: 500, category: 'food', subcategory: 'ice', image: '/products/ice.jpg', vendor: 'Ceylon Ice', location: 'Colombo', inStock: true, deliveryDays: 1, tags: ['ice', 'party', 'drinks', 'hosting', 'event'], rating: 4.2, reviewCount: 67 },

  // Festival
  { id: 'fv001', name: 'Vesak Lantern (Bamboo, Large)', nameSinhala: 'වෙසක් කූඩු', price: 1200, category: 'festival', subcategory: 'decoration', image: '/products/vesak-lantern.jpg', vendor: 'Laksala', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['vesak', 'festival', 'lantern', 'decoration', 'buddhist'], rating: 4.8, reviewCount: 234 },
  { id: 'fv002', name: 'Avurudu Oil Lamp (Brass)', nameSinhala: 'ආවුරුදු තෙල් ලාම්පු', price: 2800, category: 'festival', subcategory: 'decoration', image: '/products/oil-lamp.jpg', vendor: 'Laksala', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['avurudu', 'oil-lamp', 'traditional', 'festival', 'decoration'], rating: 4.9, reviewCount: 156 },
  { id: 'fv003', name: 'Christmas Gift Hamper (Premium)', price: 8500, category: 'festival', subcategory: 'hamper', image: '/products/xmas-hamper.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 2, tags: ['christmas', 'gift', 'hamper', 'festival'], rating: 4.6, reviewCount: 189 },
  { id: 'fv004', name: 'Eid Gift Box (Dates, Sweets, Perfume)', nameSinhala: 'ඊද් තෑගි', price: 4500, category: 'festival', subcategory: 'hamper', image: '/products/eid-gift.jpg', vendor: 'Al-Fajr', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['eid', 'ramadan', 'gift', 'festival', 'dates'], rating: 4.7, reviewCount: 112 },

  // Coffee & Personal
  { id: 'c001', name: 'Nescafé Gold Blend 200g', price: 1450, category: 'groceries', subcategory: 'beverages', image: '/products/nescafe.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['coffee', 'nescafe', 'beverage', 'morning'], rating: 4.5, reviewCount: 567 },
  { id: 'c002', name: 'Protein Powder (Whey, 1kg Chocolate)', price: 8900, category: 'groceries', subcategory: 'health', image: '/products/protein.jpg', vendor: 'HealthZone', location: 'Colombo', inStock: true, deliveryDays: 2, tags: ['protein', 'gym', 'fitness', 'health'], rating: 4.4, reviewCount: 234 },
  { id: 'c003', name: 'Purina Dog Food (Dry, 3kg)', price: 3200, category: 'groceries', subcategory: 'pet', image: '/products/dog-food.jpg', vendor: 'Cargills', location: 'Nationwide', inStock: true, deliveryDays: 1, tags: ['dog', 'pet', 'dog-food', 'purina'], rating: 4.6, reviewCount: 189 },
];

export function searchProducts(query: string, budget?: number): Product[] {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];

  const scored = SRI_LANKA_PRODUCTS
    .filter(p => !budget || p.price <= budget)
    .map(p => ({ product: p, score: scoreProduct(p, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ product }) => product);
}

export function getProductsByCategory(category: string): Product[] {
  return SRI_LANKA_PRODUCTS.filter(p => p.category === category || p.tags.includes(category));
}

export function getProductsByTags(tags: string[]): Product[] {
  if (tags.length === 0) return [];

  const normalised = tags.map(t => t.toLowerCase().trim()).filter(Boolean);

  const scored = SRI_LANKA_PRODUCTS
    .map(p => {
      let score = 0;
      const text = productSearchText(p);
      for (const tag of normalised) {
        if (p.tags.some(t => t === tag || t.includes(tag) || tag.includes(t))) score += 15;
        if (p.category === tag || p.subcategory === tag) score += 12;
        if (p.name.toLowerCase().includes(tag)) score += 10;
        if (text.includes(tag)) score += 5;
      }
      return { product: p, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ product }) => product);
}

/** Merge tag + text search, ranked by relevance */
export function findProductsForSituation(
  userMessage: string,
  tags: string[],
  budget?: number,
): Product[] {
  const byTags = getProductsByTags(tags);
  const byQuery = searchProducts([...tags, userMessage].join(' '), budget);

  const merged = new Map<string, { product: Product; score: number }>();
  byTags.forEach((p, i) => {
    merged.set(p.id, { product: p, score: (merged.get(p.id)?.score ?? 0) + 100 - i });
  });
  byQuery.forEach((p, i) => {
    const existing = merged.get(p.id);
    merged.set(p.id, { product: p, score: (existing?.score ?? 0) + 80 - i });
  });

  const results = [...merged.values()]
    .filter(({ product }) => !budget || product.price <= budget)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);

  return results;
}

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString('en-LK')}`;
}
