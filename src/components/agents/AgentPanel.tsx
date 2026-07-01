'use client';
import { motion } from 'framer-motion';
import { useKAgentStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<string, string> = {
  idle: 'rgba(255,255,255,0.12)',
  thinking: '#FCD34D',
  done: '#34D399',
  error: '#F87171',
};

export default function AgentPanel() {
  const agents = useKAgentStore(s => s.agents);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1vw, 6px)' }}>
      {agents.map(agent => (
        <motion.div
          key={agent.id}
          layout
          style={{
            background: agent.status === 'thinking'
              ? 'rgba(252,211,77,0.04)'
              : agent.status === 'done'
              ? 'rgba(52,211,153,0.03)'
              : 'rgba(255,255,255,0.02)',
            border: `1px solid ${
              agent.status === 'thinking' ? 'rgba(252,211,77,0.15)'
              : agent.status === 'done' ? 'rgba(52,211,153,0.1)'
              : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 8, padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 10px)',
            display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Status dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: STATUS_DOT[agent.status],
              boxShadow: agent.status === 'thinking' ? '0 0 6px #FCD34D'
                : agent.status === 'done' ? '0 0 4px #34D399' : 'none',
            }} className={agent.status === 'thinking' ? 'status-thinking' : ''} />
          </div>

          <span style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', flexShrink: 0 }}>{agent.emoji}</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)',
              fontWeight: 500, color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.1em',
            }}>
              {agent.name.toUpperCase()}
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 'clamp(9px, 2.2vw, 10px)',
              color: 'rgba(255,255,255,0.3)', marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {agent.status === 'idle' ? agent.description : (agent.message || agent.description)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
