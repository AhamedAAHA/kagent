'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingCart, Check, Truck } from 'lucide-react';
import { ShoppingBundle } from '@/types';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';

interface Props { bundle: ShoppingBundle; index?: number; lang?: UserLanguage; }

function ItemThumb({ src, name }: { src?: string; name: string }) {
  if (!src?.startsWith('http')) {
    return (
      <div style={{
        width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', borderRadius: 6, flexShrink: 0,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(12px, 2.5vw, 14px)',
      }}>📦</div>
    );
  }
  return (
    <div style={{
      width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', borderRadius: 6, flexShrink: 0, overflow: 'hidden',
      position: 'relative', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <Image src={src} alt={name} fill unoptimized sizes="32px" style={{ objectFit: 'cover' }} />
    </div>
  );
}

export default function BundleCard({ bundle, index = 0, lang = 'en' }: Props) {
  const addToCart = useKAgentStore(s => s.addToCart);
  const L = uiLabels(lang);
  const TIER = {
    budget:   { label: L.tierBudget,   icon: '💚', accent: '#34D399', dimAccent: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.25)' },
    midrange: { label: L.tierMid,      icon: '⭐', accent: '#A78BFA', dimAccent: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)' },
    premium:  { label: L.tierPremium,  icon: '👑', accent: '#FCD34D', dimAccent: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)' },
  };
  const cfg = TIER[bundle.tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: cfg.dimAccent, border: `1px solid ${cfg.border}`,
        borderRadius: 12, padding: 'clamp(12px, 3vw, 14px)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 10px)',
        boxShadow: bundle.tier === 'midrange' ? `0 0 24px rgba(124,58,237,0.12)` : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 12px)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)', marginBottom: 'clamp(3px, 1vw, 4px)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(12px, 2.5vw, 16px)' }}>{cfg.icon}</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)',
              color: cfg.accent, letterSpacing: '0.15em',
              background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30`,
              borderRadius: 3, padding: 'clamp(1px, 0.5vw, 2px) clamp(5px, 1.5vw, 7px)',
            }}>{cfg.label}</span>
            {bundle.tier === 'midrange' && (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 1.5vw, 8px)', color: '#A78BFA',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 3, padding: 'clamp(1px, 0.5vw, 2px) clamp(4px, 1.5vw, 6px)', letterSpacing: '0.1em',
              }}>{L.popular}</span>
            )}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 600, color: '#fff' }}>{bundle.name}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(9px, 2vw, 10px)', color: 'rgba(255,255,255,0.4)', marginTop: 'clamp(1px, 0.5vw, 2px)' }}>{bundle.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 800, color: '#fff' }}>{formatPrice(bundle.totalPrice)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(3px, 1vw, 4px)', justifyContent: 'flex-end', marginTop: 'clamp(2px, 1vw, 3px)' }}>
            <Truck size={10} style={{ color: '#34D399' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 1.5vw, 8px)', color: '#34D399', letterSpacing: '0.08em' }}>{bundle.estimatedDelivery}</span>
          </div>
        </div>
      </div>

      {/* Item thumbnails */}
      <div style={{ display: 'flex', gap: 'clamp(4px, 1.5vw, 6px)', flexWrap: 'wrap' }}>
        {bundle.items.slice(0, 5).map(item => (
          <ItemThumb key={item.product.id} src={item.product.image} name={item.product.name} />
        ))}
      </div>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1.5vw, 5px)' }}>
        {bundle.items.slice(0, 5).map(item => (
          <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)' }}>
            <Check size={10} style={{ color: cfg.accent, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(10px, 2vw, 11px)', color: 'rgba(255,255,255,0.65)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.product.name}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {formatPrice(item.product.price)}
            </span>
          </div>
        ))}
        {bundle.items.length > 5 && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(9px, 2vw, 10px)', color: 'rgba(255,255,255,0.25)', paddingLeft: 'clamp(12px, 2.5vw, 16px)' }}>
            +{bundle.items.length - 5} more items
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => bundle.items.forEach(item => addToCart(item))}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px, 1.5vw, 6px)',
          background: cfg.accent, border: 'none', borderRadius: 8, padding: 'clamp(8px, 2vw, 10px) 0',
          color: '#000', fontSize: 'clamp(10px, 2vw, 11px)', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        <ShoppingCart size={12} />
        {L.bundleAdd} ({bundle.items.length})
      </button>
    </motion.div>
  );
}
