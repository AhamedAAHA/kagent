import { NextResponse } from 'next/server';
import { searchKaprukaProducts } from '@/lib/kapruka-products';

/** Live Kapruka stats for landing page HalideTopo card */
export async function GET() {
  try {
    const products = await searchKaprukaProducts('gift hamper', 3);
    const featured = products[0];
    return NextResponse.json({
      live: products.length > 0,
      productCount: products.length,
      featuredName: featured?.name ?? 'Kapruka Catalog',
      featuredPrice: featured?.price ?? 0,
      featuredImage: featured?.image ?? null,
    });
  } catch {
    return NextResponse.json({
      live: false,
      productCount: 0,
      featuredName: 'Kapruka Catalog',
      featuredPrice: 0,
      featuredImage: null,
    });
  }
}
