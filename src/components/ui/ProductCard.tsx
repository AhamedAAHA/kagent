'use client';
import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/types';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

interface Props { product: Product; index?: number; }

const CAT_EMOJI: Record<string, string> = {
  food: '🍛', electronics: '📱', household: '🏠',
  clothing: '👔', gifts: '🎁', stationery: '📚',
  beauty: '✨', groceries: '🛒', flowers: '🌸', festival: '🎉',
};

export default function ProductCard({ product, index = 0 }: Props) {
  const addToCart = useKAgentStore(s => s.addToCart);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="product-card glass"
      style={{ borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* Icon */}
      <div style={{
        height: 64, borderRadius: 7,
        background: 'rgba(124,58,237,0.06)',
        border: '1px solid rgba(124,58,237,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>
        {CAT_EMOJI[product.category] ?? '📦'}
      </div>

      {/* Info */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>
        {product.nameSinhala && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{product.nameSinhala}</p>
        )}
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          {product.vendor}
        </p>
      </div>

      {/* Rating + delivery */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Star size={10} style={{ fill: '#FCD34D', color: '#FCD34D' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{product.rating}</span>
        <span style={{ fontSize: 9, color: 'rgba(52,211,153,0.7)', marginLeft: 'auto' }}>
          {product.deliveryDays <= 1 ? 'Same day' : `${product.deliveryDays}d`}
        </span>
      </div>

      {/* Price + add */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatPrice(product.price)}</span>
        <button
          onClick={() => addToCart({ product, quantity: 1 })}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
            color: '#A78BFA', fontSize: 10, padding: '4px 8px', borderRadius: 6,
            cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'JetBrains Mono, monospace',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.2)'; }}
        >
          <ShoppingCart size={10} /> ADD
        </button>
      </div>
    </motion.div>
  );
}
