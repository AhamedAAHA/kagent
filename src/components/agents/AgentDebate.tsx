'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentDebateMessage } from '@/types';

interface Props { debate: AgentDebateMessage[]; }

const AGENT_META: Record<string, { color: string; emoji: string }> = {
  concierge:   { color: '#A78BFA', emoji: '🎯' },
  'life-event':{ color: '#FCD34D', emoji: '🌟' },
  memory:      { color: '#FB923C', emoji: '💾' },
  shopping:    { color: '#34D399', emoji: '🛒' },
  festival:    { color: '#F87171', emoji: '🎉' },
  budget:      { color: '#A78BFA', emoji: '💰' },
  delivery:    { color: '#22D3EE', emoji: '🚚' },
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  statement:  { label: 'STATEMENT', color: 'rgba(255,255,255,0.2)' },
  objection:  { label: 'OBJECTION', color: '#F87171' },
  agreement:  { label: 'AGREEMENT', color: '#34D399' },
  verdict:    { label: 'VERDICT',   color: '#FCD34D' },
};

export default function AgentDebate({ debate }: Props) {
  if (!debate || debate.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 1.5vw, 8px)',
        color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em',
        marginBottom: 'clamp(8px, 2.5vw, 10px)',
      }}>
        ── AGENT DEBATE ──────────────────────────────
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1.5vw, 6px)' }}>
        <AnimatePresence>
          {debate.map((msg, i) => {
            const meta = AGENT_META[msg.agentId] ?? { color: '#fff', emoji: '🤖' };
            const badge = TYPE_BADGE[msg.type] ?? TYPE_BADGE.statement;
            const isVerdict = msg.type === 'verdict';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                style={{
                  display: 'flex', gap: 'clamp(8px, 2vw, 10px)', alignItems: 'flex-start',
                  padding: isVerdict ? 'clamp(8px, 2vw, 10px) clamp(10px, 3vw, 12px)' : 'clamp(6px, 2vw, 8px) clamp(10px, 3vw, 12px)',
                  background: isVerdict
                    ? 'rgba(252,211,77,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isVerdict ? 'rgba(252,211,77,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 8,
                  borderLeft: `3px solid ${meta.color}`,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 'clamp(22px, 6vw, 26px)', height: 'clamp(22px, 6vw, 26px)', borderRadius: '50%', flexShrink: 0,
                  background: `${meta.color}18`,
                  border: `1px solid ${meta.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                }}>
                  {meta.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)', marginBottom: 'clamp(2px, 0.5vw, 3px)' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)',
                      color: meta.color, fontWeight: 700, letterSpacing: '0.1em',
                    }}>
                      {msg.agentId.toUpperCase()}
                    </span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(6px, 1.5vw, 7px)',
                      color: badge.color, letterSpacing: '0.12em',
                      background: `${badge.color}18`, border: `1px solid ${badge.color}40`,
                      borderRadius: 3, padding: 'clamp(1px, 0.5vw, 1px) clamp(3px, 1vw, 5px)',
                    }}>
                      {badge.label}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 2.5vw, 12px)',
                    color: isVerdict ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    lineHeight: 1.5,
                    fontWeight: isVerdict ? 500 : 400,
                  }}>
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
