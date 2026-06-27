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
        fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
        color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em',
        marginBottom: 10,
      }}>
        ── AGENT DEBATE ──────────────────────────────
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: isVerdict ? '10px 12px' : '8px 12px',
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
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: `${meta.color}18`,
                  border: `1px solid ${meta.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>
                  {meta.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                      color: meta.color, fontWeight: 700, letterSpacing: '0.1em',
                    }}>
                      {msg.agentId.toUpperCase()}
                    </span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 7,
                      color: badge.color, letterSpacing: '0.12em',
                      background: `${badge.color}18`, border: `1px solid ${badge.color}40`,
                      borderRadius: 3, padding: '1px 5px',
                    }}>
                      {badge.label}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 12,
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
