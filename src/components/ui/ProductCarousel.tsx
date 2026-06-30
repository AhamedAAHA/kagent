'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { UserLanguage } from '@/lib/language';

interface Props {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  lang?: UserLanguage;
}

export default function ProductCarousel({ products, onSelectProduct, lang = 'en' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="carousel-nav"
            style={{
              position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              background: 'rgba(10,6,20,0.9)', border: '1px solid var(--border)', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#A78BFA', cursor: 'pointer',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="carousel-nav"
            style={{
              position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              background: 'rgba(10,6,20,0.9)', border: '1px solid var(--border)', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#A78BFA', cursor: 'pointer',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory',
          padding: '4px 28px', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            style={{ minWidth: 160, maxWidth: 160, flexShrink: 0, scrollSnapAlign: 'start' }}
          >
            <ProductCard product={product} index={i} compact onView={onSelectProduct} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
}
