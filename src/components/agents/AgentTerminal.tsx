'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKAgentStore } from '@/lib/store';
import { Terminal, X } from 'lucide-react';

interface Props {
  onClose?: () => void;
  closeLabel?: string;
}

const AGENT_COLORS: Record<string, string> = {
  'concierge':  '#A78BFA',
  'life-event': '#FCD34D',
  'memory':     '#FB923C',
  'shopping':   '#34D399',
  'festival':   '#F87171',
  'budget':     '#A78BFA',
  'delivery':   '#22D3EE',
};

export default function AgentTerminal({ onClose, closeLabel = 'Close' }: Props) {
  const terminalLines = useKAgentStore(s => s.terminalLines);
  const isLoading = useKAgentStore(s => s.isLoading);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#020208',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden',
      height: '100%', minHeight: 320,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#F87171','#FCD34D','#34D399'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <Terminal size={11} style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 4 }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em',
        }}>KAGENT — LIVE AGENT STREAM</span>
        {isLoading && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 6px #34D399',
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#34D399', letterSpacing: '0.1em' }}>
              PROCESSING
            </span>
          </div>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            style={{
              marginLeft: isLoading ? 8 : 'auto',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: 4, cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        lineHeight: 1.7,
      }}>
        {terminalLines.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.15)', paddingTop: 8 }}>
            <span style={{ color: 'rgba(124,58,237,0.6)' }}>kagent@lk</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>:~$ </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>waiting for mission...</span>
            <span style={{
              display: 'inline-block', width: 7, height: 13,
              background: 'rgba(255,255,255,0.3)',
              marginLeft: 3, verticalAlign: 'middle',
              animation: 'blink-cursor 1.2s step-end infinite',
            }} />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {terminalLines.map((line, i) => {
              const color = AGENT_COLORS[line.agentId] ?? '#fff';
              const isSystem = line.agentId === 'system';
              return (
                <motion.div
                  key={`${line.ts}-${i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 2 }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, fontSize: 10 }}>
                    {new Date(line.ts).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span style={{
                    color, flexShrink: 0, fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', minWidth: 80, paddingTop: 1,
                    textTransform: 'uppercase',
                  }}>
                    [{line.agentId.slice(0, 8)}]
                  </span>
                  <span style={{ color: isSystem ? '#FCD34D' : 'rgba(255,255,255,0.75)', wordBreak: 'break-word' }}>
                    {line.text}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {isLoading && terminalLines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ color: 'rgba(124,58,237,0.5)' }}>kagent@lk:~$</span>
            <span style={{
              display: 'inline-block', width: 7, height: 13,
              background: 'rgba(124,58,237,0.6)',
              animation: 'blink-cursor 1.2s step-end infinite',
            }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
