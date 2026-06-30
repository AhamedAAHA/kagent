import { NextRequest, NextResponse } from 'next/server';
import { getKaprukaProduct } from '@/lib/kapruka-products';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const product = await getKaprukaProduct(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
