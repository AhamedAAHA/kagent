import { NextResponse } from 'next/server';
import { searchKaprukaProducts } from '@/lib/kapruka-products';

export const dynamic = 'force-dynamic';

const SPOTLIGHT_QUERIES = ['roses bouquet', 'birthday gift', 'gift hamper'];

/** Live Kapruka stats for landing page HalideTopo card */
export async function GET() {
  try {
    const batches = await Promise.all(
      SPOTLIGHT_QUERIES.map(q => searchKaprukaProducts(q, 4)),
    );

    const merged = new Map<string, (typeof batches)[0][0]>();
    for (const batch of batches) {
      for (const p of batch) {
        if (!merged.has(p.id)) merged.set(p.id, p);
      }
    }

    const products = [...merged.values()].filter(p => p.price > 0);
    const featured =
      products.find(p => p.image?.startsWith('http') && p.inStock) ??
      products.find(p => p.inStock) ??
      products[0];

    return NextResponse.json(
      {
        live: products.length > 0,
        productCount: products.length,
        featuredName: featured?.name ?? 'Kapruka Catalog',
        featuredPrice: featured?.price ?? 0,
        featuredImage: featured?.image ?? null,
        featuredId: featured?.kaprukaId ?? null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        live: false,
        productCount: 0,
        featuredName: 'Kapruka Catalog',
        featuredPrice: 0,
        featuredImage: null,
        featuredId: null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}
