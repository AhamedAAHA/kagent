'use client';

import { useKAgentStore } from '@/lib/store';
import { uiLabels } from '@/lib/ui-strings';
import { UserLanguage } from '@/lib/language';

interface Props {
  lang: UserLanguage;
}

export default function MobileAgentStrip({ lang }: Props) {
  const agents = useKAgentStore(s => s.agents);
  const L = uiLabels(lang);
  const active = agents.filter(a => a.status === 'thinking').length;
  const done = agents.filter(a => a.status === 'done').length;

  return (
    <div className="show-mobile-only" style={{
      display: 'none', padding: '8px 14px', borderBottom: '1px solid var(--border)',
      background: 'rgba(4,2,12,0.95)', overflowX: 'auto', gap: 6,
      WebkitOverflowScrolling: 'touch',
    }}>
      <style>{`
        @media (max-width: 899px) {
          .show-mobile-only { display: flex !important; align-items: center; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
        color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', flexShrink: 0,
      }}>
        {L.agents}
      </span>
      {agents.map(a => (
        <span
          key={a.id}
          title={a.message ?? a.description}
          style={{
            flexShrink: 0, fontSize: 14, opacity: a.status === 'idle' ? 0.35 : 1,
            filter: a.status === 'thinking' ? 'drop-shadow(0 0 6px rgba(124,58,237,0.8))' : undefined,
            transform: a.status === 'thinking' ? 'scale(1.1)' : undefined,
            transition: 'all 0.2s',
          }}
        >
          {a.emoji}
        </span>
      ))}
      <span style={{
        marginLeft: 'auto', flexShrink: 0,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
        color: active > 0 ? '#A78BFA' : 'rgba(52,211,153,0.7)',
        letterSpacing: '0.1em',
      }}>
        {active > 0 ? `${active} ${L.mobileAgents}` : `${done}/7 ✓`}
      </span>
    </div>
  );
}
