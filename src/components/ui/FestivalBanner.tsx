'use client';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Festival } from '@/types';
import { useState } from 'react';

interface Props { festival: Festival; onShop: (msg: string) => void; }

export default function FestivalBanner({ festival, onShop }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="festival-banner"
      style={{
        background: 'rgba(217,119,6,0.06)',
        border: '1px solid rgba(217,119,6,0.25)',
        borderRadius: 10, padding: '10px 12px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🎊</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(217,119,6,0.7)', letterSpacing: '0.15em', marginBottom: 3 }}>
          {festival.daysUntil <= 3 ? 'URGENT — ' : ''}{festival.daysUntil}D AWAY
        </div>
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{festival.name}</p>
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{festival.nameSinhala}</p>
        <button
          onClick={() => onShop(`Help me prepare for ${festival.name} in ${festival.daysUntil} days`)}
          style={{
            marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
            background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)',
            color: 'rgba(217,119,6,0.9)', borderRadius: 4, padding: '4px 10px',
            cursor: 'pointer', letterSpacing: '0.1em',
          }}
        >
          PREPARE NOW →
        </button>
      </div>
      <button onClick={() => setDismissed(true)} style={{ color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={13} />
      </button>
    </motion.div>
  );
}
