'use client';
import { motion } from 'framer-motion';
import CounterTicker from './CounterTicker';

interface Props {
  spent: number;
  budget?: number;
}

export default function BudgetRing({ spent, budget }: Props) {
  const hasBudget = budget && budget > 0;
  const pct = hasBudget ? Math.min(spent / budget, 1) : 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  const color = pct > 0.9 ? '#F87171' : pct > 0.7 ? '#FCD34D' : '#34D399';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          {/* Progress */}
          <motion.circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            CART
          </div>
          <CounterTicker
            value={spent}
            prefix="Rs."
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff' }}
          />
        </div>
      </div>

      {hasBudget && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            BUDGET: Rs.{budget.toLocaleString('en-LK')}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color, marginTop: 2 }}>
            {Math.round(pct * 100)}% USED
          </div>
        </div>
      )}
    </div>
  );
}
