'use client';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Truck } from 'lucide-react';
import { ShoppingBundle } from '@/types';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

interface Props { bundle: ShoppingBundle; index?: number; }

const TIER = {
  budget:   { label: 'BUDGET',      icon: '💚', accent: '#34D399', dimAccent: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.25)' },
  midrange: { label: 'RECOMMENDED', icon: '⭐', accent: '#A78BFA', dimAccent: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)' },
  premium:  { label: 'COMPLETE',    icon: '👑', accent: '#FCD34D', dimAccent: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)' },
};

export default function BundleCard({ bundle, index = 0 }: Props) {
  const addToCart = useKAgentStore(s => s.addToCart);
  const cfg = TIER[bundle.tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: cfg.dimAccent, border: `1px solid ${cfg.border}`,
        borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: bundle.tier === 'midrange' ? `0 0 24px rgba(124,58,237,0.12)` : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span>{cfg.icon}</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: cfg.accent, letterSpacing: '0.15em',
              background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30`,
              borderRadius: 3, padding: '2px 7px',
            }}>{cfg.label}</span>
            {bundle.tier === 'midrange' && (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#A78BFA',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 3, padding: '2px 6px', letterSpacing: '0.1em',
              }}>POPULAR</span>
            )}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>{bundle.name}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{bundle.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>{formatPrice(bundle.totalPrice)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}>
            <Truck size={10} style={{ color: '#34D399' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#34D399', letterSpacing: '0.08em' }}>{bundle.estimatedDelivery}</span>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {bundle.items.slice(0, 5).map(item => (
          <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={10} style={{ color: cfg.accent, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.65)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.product.name}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {formatPrice(item.product.price)}
            </span>
          </div>
        ))}
        {bundle.items.length > 5 && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.25)', paddingLeft: 16 }}>
            +{bundle.items.length - 5} more items
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => bundle.items.forEach(item => addToCart(item))}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: cfg.accent, border: 'none', borderRadius: 8, padding: '10px 0',
          color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        <ShoppingCart size={12} />
        ADD {bundle.items.length} ITEMS TO CART
      </button>
    </motion.div>
  );
}
