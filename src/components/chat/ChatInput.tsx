'use client';
import { useState, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import VoiceInput from './VoiceInput';
import SurpriseMode from '@/components/ui/SurpriseMode';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  showSurprise?: boolean;
  lang?: UserLanguage;
}

export default function ChatInput({ onSend, disabled, showSurprise = false, lang = 'en' }: Props) {
  const [value, setValue] = useState('');
  const L = uiLabels(lang);

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 8px)' }}>
      {showSurprise && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 2vw, 8px)' }}>
          <SurpriseMode onSurprise={msg => onSend(msg)} />
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 'clamp(6px, 2vw, 8px)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14, padding: 'clamp(8px, 2vw, 10px) clamp(8px, 2vw, 10px) clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
        transition: 'border-color 0.2s',
      }}>
        <Sparkles size={13} style={{ color: 'rgba(124,58,237,0.5)', flexShrink: 0, marginBottom: 'clamp(10px, 2vw, 12px)' }} />
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={L.chatPlaceholder}
          rows={1}
          disabled={disabled}
          className="chat-input"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 'clamp(12px, 2.5vw, 13px)', resize: 'none',
            fontFamily: lang === 'si' ? 'Inter, "Noto Sans Sinhala", sans-serif' : 'Inter, sans-serif',
            lineHeight: 1.6, minHeight: 'clamp(36px, 8vw, 40px)', maxHeight: 110, paddingTop: 'clamp(6px, 1.5vw, 8px)',
          }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 110) + 'px';
          }}
        />
        <VoiceInput
          lang={lang}
          disabled={disabled}
          labels={{
            start: L.voiceStart,
            stop: L.voiceStop,
            unsupported: L.voiceUnsupported,
            denied: L.voiceDenied,
            error: L.voiceError,
          }}
          onTranscript={t => {
            const text = t.trim();
            if (!text || disabled) return;
            onSend(text);
            setValue('');
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label={L.send}
          style={{
            width: 'clamp(34px, 8vw, 38px)', height: 'clamp(34px, 8vw, 38px)', borderRadius: 10, border: 'none', flexShrink: 0,
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
        fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 1.5vw, 8px)',
        color: 'rgba(255,255,255,0.15)', textAlign: 'center', letterSpacing: '0.1em',
      }}>
        {L.chatFooter}
      </p>
    </div>
  );
}
