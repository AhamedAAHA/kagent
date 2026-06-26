'use client';
import { useState, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
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
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14, padding: '10px 10px 10px 16px',
      transition: 'border-color 0.2s',
    }}>
      <Sparkles size={14} style={{ color: 'rgba(124,58,237,0.5)', flexShrink: 0, marginBottom: 12 }} />
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder="What's happening in your life? (e.g. I'm moving next month…)"
        rows={1}
        disabled={disabled}
        className="chat-input font-mono-custom"
        style={{
          flex: 1, background: 'transparent', border: 'none',
          color: 'var(--text)', fontSize: 12, letterSpacing: '0.02em',
          resize: 'none', fontFamily: 'Inter, sans-serif',
          lineHeight: 1.6, minHeight: 40, maxHeight: 100,
          paddingTop: 8,
        }}
        onInput={e => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = Math.min(el.scrollHeight, 100) + 'px';
        }}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        style={{
          width: 38, height: 38, borderRadius: 10, border: 'none',
          background: value.trim() && !disabled ? '#7C3AED' : 'rgba(124,58,237,0.2)',
          color: value.trim() && !disabled ? '#fff' : 'rgba(255,255,255,0.3)',
          cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', flexShrink: 0,
        }}
      >
        <Send size={15} />
      </button>
    </div>
  );
}
