import { Product, ProductCategory } from '@/types';
import { callKaprukaTool } from './kapruka';
import { findProductsForSituation as findLocalProducts } from './products';
import { tanglishSearchTerms } from './language';

export interface KaprukaSearchResult {
  id: string;
  name: string;
  summary?: string;
  price: { amount: number; currency: string };
  compare_at_price?: { amount: number; currency: string } | null;
  in_stock: boolean;
  stock_level?: string;
  image_url?: string;
  category?: { id: string; name: string; slug: string };
  rating?: number | null;
  ships_internationally?: boolean;
  url?: string;
}

interface KaprukaSearchResponse {
  results: KaprukaSearchResult[];
  next_cursor?: string;
}

function inferCategory(id: string, name: string, slug?: string): ProductCategory {
  const upper = id.toUpperCase();
  const text = `${name} ${slug ?? ''}`.toLowerCase();
  if (upper.startsWith('FLOWER') || text.includes('rose') || text.includes('flower')) return 'flowers';
  if (upper.startsWith('CAKE') || text.includes('cake')) return 'food';
  if (text.includes('electronic') || text.includes('laptop') || text.includes('phone')) return 'electronics';
  if (text.includes('stationery') || text.includes('book')) return 'stationery';
  if (text.includes('beauty') || text.includes('perfume')) return 'beauty';
  if (text.includes('grocery') || text.includes('tea') || text.includes('coffee')) return 'groceries';
  if (text.includes('hamper') || text.includes('gift')) return 'gifts';
  return 'gifts';
}

function kaprukaToProduct(item: KaprukaSearchResult): Product {
  const slug = item.category?.slug;
  const category = inferCategory(item.id, item.name, slug);
  const tags = [
    slug ?? 'kapruka',
    category,
    ...(item.summary?.toLowerCase().split(/\W+/).filter(w => w.length > 3).slice(0, 6) ?? []),
  ];

  return {
    id: item.id,
    kaprukaId: item.id,
    name: item.name,
    price: item.price.amount,
    category,
    subcategory: item.category?.name?.toLowerCase() ?? 'general',
    image: item.image_url ?? '',
    productUrl: item.url,
    vendor: 'Kapruka',
    location: 'Nationwide',
    inStock: item.in_stock,
    deliveryDays: category === 'flowers' || category === 'food' ? 1 : 2,
    tags: [...new Set(tags)],
    rating: item.rating ?? 4.5,
    reviewCount: 0,
    source: 'kapruka',
  };
}

export async function searchKaprukaProducts(
  query: string,
  limit = 10,
  budget?: number,
): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const data = await callKaprukaTool<KaprukaSearchResponse>('kapruka_search_products', {
      q,
      limit,
      in_stock_only: true,
      response_format: 'json',
    });

    return (data.results ?? [])
      .map(kaprukaToProduct)
      .filter(p => !budget || p.price <= budget);
  } catch {
    return [];
  }
}

export async function getKaprukaProduct(productId: string): Promise<Product | null> {
  try {
    const data = await callKaprukaTool<{ product?: KaprukaSearchResult } & KaprukaSearchResult>(
      'kapruka_get_product',
      { product_id: productId, response_format: 'json' },
    );
    const item = (data as { product?: KaprukaSearchResult }).product ?? data;
    if (!item?.id || !item.name) return null;
    return kaprukaToProduct(item as KaprukaSearchResult);
  } catch {
    return null;
  }
}

const EVENT_QUERIES: Record<string, string[]> = {
  moving: ['home gift hamper', 'kitchen essentials', 'bedroom gift'],
  university: ['student gift', 'study gift hamper', 'laptop bag gift'],
  birthday: ['birthday gift', 'roses', 'chocolate gift'],
  anniversary: ['roses', 'gift hamper', 'chocolate gift'],
  hosting: ['gift hamper', 'party food', 'chocolate gift box'],
  festival: ['gift hamper', 'traditional gift', 'avurudu gift'],
  surprise: ['gift surprise', 'gift hamper', 'roses'],
  redeploy: ['office gift', 'coffee gift', 'desk gift'],
  general: ['gift hamper'],
};

function buildSearchQueries(event: string, tags: string[], userMessage: string): string[] {
  const queries = new Set<string>();

  for (const q of EVENT_QUERIES[event] ?? EVENT_QUERIES.general) {
    queries.add(q);
  }

  for (const term of tanglishSearchTerms(userMessage)) {
    queries.add(term);
  }

  for (const tag of tags.slice(0, 4)) {
    const t = tag.trim();
    if (t.length >= 3) queries.add(t);
  }

  const words = userMessage
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .slice(0, 3);
  for (const w of words) queries.add(w);

  return [...queries].slice(0, 4);
}

/** Search live Kapruka catalog; fall back to local mock catalog on failure. */
export async function findKaprukaProductsForSituation(
  userMessage: string,
  tags: string[],
  event: string,
  budget?: number,
): Promise<{ products: Product[]; source: 'kapruka' | 'local' }> {
  const queries = buildSearchQueries(event, tags, userMessage);
  const merged = new Map<string, Product>();

  const results = await Promise.all(
    queries.map(q => searchKaprukaProducts(q, 8, budget)),
  );

  for (const batch of results) {
    for (const p of batch) {
      if (!merged.has(p.id)) merged.set(p.id, p);
    }
  }

  const products = [...merged.values()];
  if (products.length > 0) {
    return { products, source: 'kapruka' };
  }

  const local = findLocalProducts(userMessage, tags, budget);
  for (const p of local) {
    if (!merged.has(p.id)) merged.set(p.id, { ...p, source: 'local' });
  }

  return {
    products: [...merged.values()],
    source: products.length > 0 ? 'kapruka' : 'local',
  };
}

export interface KaprukaDeliveryCheck {
  city: string;
  available: boolean;
  rate?: number;
  currency?: string;
  checked_date?: string;
  next_available_date?: string | null;
  reason?: string | null;
}

export async function checkKaprukaDelivery(
  city: string,
  deliveryDate?: string,
  productId?: string,
): Promise<KaprukaDeliveryCheck | null> {
  try {
    return await callKaprukaTool<KaprukaDeliveryCheck>('kapruka_check_delivery', {
      city,
      delivery_date: deliveryDate,
      product_id: productId,
      response_format: 'json',
    });
  } catch {
    return null;
  }
}

export interface KaprukaCity {
  name: string;
  aliases: string[];
}

export async function listKaprukaCities(query?: string): Promise<KaprukaCity[]> {
  try {
    const data = await callKaprukaTool<{ cities: KaprukaCity[] }>('kapruka_list_delivery_cities', {
      query: query ?? 'colombo',
      limit: 30,
      response_format: 'json',
    });
    return data.cities ?? [];
  } catch {
    return [
      { name: 'Colombo 03', aliases: ['Colombo'] },
      { name: 'Colombo 05', aliases: [] },
      { name: 'Kandy', aliases: [] },
      { name: 'Galle', aliases: [] },
    ];
  }
}

export interface KaprukaCheckoutResult {
  checkout_url: string;
  order_ref: string;
  summary: {
    items_total: number;
    delivery_fee: number;
    addons_total?: number;
    grand_total: number;
    currency: string;
  };
  expires_at: string;
}

export interface KaprukaCreateOrderInput {
  cart: { product_id: string; quantity: number; icing_text?: string }[];
  recipient: { name: string; phone: string };
  delivery: {
    address: string;
    city: string;
    location_type?: string;
    date: string;
    instructions?: string;
  };
  sender: { name: string; anonymous?: boolean };
  gift_message?: string;
  currency?: string;
}

export async function createKaprukaOrder(
  input: KaprukaCreateOrderInput,
): Promise<KaprukaCheckoutResult> {
  return callKaprukaTool<KaprukaCheckoutResult>('kapruka_create_order', {
    ...input,
    currency: input.currency ?? 'LKR',
    response_format: 'json',
  });
}
