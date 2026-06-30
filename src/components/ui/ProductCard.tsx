'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';
import { ProductImageSkeleton } from './ProductSkeleton';

interface Props {
  product: Product;
  index?: number;
  compact?: boolean;
  onView?: (product: Product) => void;
  lang?: UserLanguage;
  loading?: boolean;
}

const CAT_EMOJI: Record<string, string> = {
  food: '🍛', electronics: '📱', household: '🏠',
  clothing: '👔', gifts: '🎁', stationery: '📚',
  beauty: '✨', groceries: '🛒', flowers: '🌸', festival: '🎉',
};

export default function ProductCard({ product, index = 0, compact, onView, lang = 'en', loading }: Props) {
  const addToCart = useKAgentStore(s => s.addToCart);
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const L = uiLabels(lang);
  const imageUrl = product.image?.startsWith('http') ? product.image : '';
  const showImage = Boolean(imageUrl) && !imgError;

  if (loading) {
    return (
      <div className="product-card glass" style={{ borderRadius: 10, padding: compact ? 8 : 10, minWidth: 160 }}>
        <ProductImageSkeleton height={compact ? 88 : 96} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="product-card glass"
      style={{ borderRadius: 10, padding: compact ? 8 : 10, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}
    >
      <button
        type="button"
        onClick={() => onView?.(product)}
        style={{
          height: compact ? 88 : 96, borderRadius: 7, overflow: 'hidden',
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', padding: 0, cursor: onView ? 'pointer' : 'default', width: '100%',
        }}
      >
        {showImage ? (
          <>
            {imgLoading && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <ProductImageSkeleton height={compact ? 88 : 96} />
              </div>
            )}
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              unoptimized
              sizes="160px"
              style={{ objectFit: 'cover', opacity: imgLoading ? 0 : 1, transition: 'opacity 0.2s' }}
              onLoad={() => setImgLoading(false)}
              onError={() => { setImgError(true); setImgLoading(false); }}
            />
          </>
        ) : (
          <span style={{ fontSize: 28 }}>{CAT_EMOJI[product.category] ?? '📦'}</span>
        )}
        {product.source === 'kapruka' && (
          <span style={{
            position: 'absolute', top: 6, right: 6, zIndex: 2,
            background: 'rgba(124,58,237,0.85)', color: '#fff',
            fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
          }}>
            {L.kaprukaLive}
          </span>
        )}
        {product.inStock && (
          <span style={{
            position: 'absolute', bottom: 6, left: 6, zIndex: 2,
            background: 'rgba(5,150,105,0.85)', color: '#fff',
            fontSize: 7, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
          }}>
            {L.inStock}
          </span>
        )}
      </button>

      <div>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          {product.vendor}
        </p>
      </div>

      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={10} style={{ fill: '#FCD34D', color: '#FCD34D' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{product.rating}</span>
          <span style={{ fontSize: 9, color: 'rgba(52,211,153,0.7)', marginLeft: 'auto' }}>
            {product.deliveryDays <= 1 ? L.sameDay : `${product.deliveryDays}d`}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 'auto' }}>
        <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: '#fff' }}>{formatPrice(product.price)}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {onView && (
            <button
              type="button"
              onClick={() => onView(product)}
              aria-label={L.viewDetails}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                color: 'rgba(255,255,255,0.5)', padding: '4px 6px', borderRadius: 6, cursor: 'pointer',
              }}
            >
              <Eye size={10} />
            </button>
          )}
          <button
            type="button"
            onClick={() => addToCart({ product, quantity: 1 })}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
              color: '#A78BFA', fontSize: 10, padding: '4px 8px', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <ShoppingCart size={10} /> {L.addToCart}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
