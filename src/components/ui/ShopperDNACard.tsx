'use client';
import { motion } from 'framer-motion';
import { ShopperDNA } from '@/types';
import { Cpu } from 'lucide-react';

interface Props { dna: ShopperDNA; compact?: boolean; }

const TRAIT_COLORS = ['#A78BFA','#34D399','#FCD34D','#F87171','#22D3EE','#FB923C'];

export default function ShopperDNACard({ dna, compact = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(217,119,6,0.05))',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 12, padding: compact ? '12px 14px' : '14px 16px',
        marginTop: compact ? 0 : 12,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Scan line animation */}
      <motion.div
        initial={{ top: '-100%' }}
        animate={{ top: '110%' }}
        transition={{ duration: 1.2, ease: 'linear' }}
        style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Cpu size={13} style={{ color: '#A78BFA' }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          color: '#A78BFA', letterSpacing: '0.18em', fontWeight: 700,
        }}>
          SHOPPER DNA — PROFILE GENERATED
        </span>
      </div>

      {/* Personality tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: 6, padding: '4px 12px', marginBottom: 10,
      }}>
        <span style={{ fontSize: 16 }}>🧬</span>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
          color: '#C4B5FD',
        }}>{dna.personalityTag}</span>
      </div>

      {/* Traits */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {dna.traits.map((trait, i) => (
          <motion.span
            key={trait}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: TRAIT_COLORS[i % TRAIT_COLORS.length],
              background: `${TRAIT_COLORS[i % TRAIT_COLORS.length]}15`,
              border: `1px solid ${TRAIT_COLORS[i % TRAIT_COLORS.length]}30`,
              borderRadius: 4, padding: '3px 9px', letterSpacing: '0.1em',
            }}
          >
            {trait}
          </motion.span>
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
      }}>
        {[
          { label: 'BUDGET STYLE',   value: dna.budgetStyle },
          { label: 'DELIVERY PREF',  value: dna.deliveryPref },
          { label: 'TOP CATEGORIES', value: dna.topCategories.slice(0,2).join(', ') || 'General' },
        ].map(stat => (
          <div key={stat.label}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 7,
              color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 2,
            }}>{stat.label}</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11,
              color: 'rgba(255,255,255,0.75)', fontWeight: 500,
            }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
