'use client';
import { useState, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import VoiceInput from './VoiceInput';
import SurpriseMode from '@/components/ui/SurpriseMode';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  showSurprise?: boolean;
}

export default function ChatInput({ onSend, disabled, showSurprise = false }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Extra tools row */}
      {showSurprise && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <SurpriseMode onSurprise={msg => onSend(msg)} />
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14, padding: '10px 10px 10px 16px',
        transition: 'border-color 0.2s',
      }}>
        <Sparkles size={13} style={{ color: 'rgba(124,58,237,0.5)', flexShrink: 0, marginBottom: 12 }} />
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="What's happening in your life?  (e.g. I'm moving next month…)"
          rows={1}
          disabled={disabled}
          className="chat-input"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 13, resize: 'none',
            fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
            minHeight: 40, maxHeight: 110, paddingTop: 8,
          }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 110) + 'px';
          }}
        />
        <VoiceInput onTranscript={t => { setValue(t); }} disabled={disabled} />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
            background: value.trim() && !disabled ? '#7C3AED' : 'rgba(124,58,237,0.15)',
            color: value.trim() && !disabled ? '#fff' : 'rgba(255,255,255,0.2)',
            cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={15} />
        </button>
      </div>

      <p style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
        color: 'rgba(255,255,255,0.15)', textAlign: 'center', letterSpacing: '0.1em',
      }}>
        POWERED BY 7 AI AGENTS · REAL SRI LANKAN PRODUCTS · VOICE ENABLED
      </p>
    </div>
  );
}
