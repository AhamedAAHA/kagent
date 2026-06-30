'use client';

import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';

interface Props {
  lang: UserLanguage;
  onChange: (lang: UserLanguage) => void;
}

const OPTIONS: UserLanguage[] = ['en', 'si', 'tanglish'];

export default function LanguageToggle({ lang, onChange }: Props) {
  const L = uiLabels(lang);

  const label = (l: UserLanguage) => {
    if (l === 'si') return L.langSi;
    if (l === 'tanglish') return L.langTg;
    return L.langEn;
  };

  return (
    <div style={{
      display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border)', borderRadius: 8, padding: 2,
    }}>
      {OPTIONS.map(l => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          style={{
            padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.08em',
            background: lang === l ? 'rgba(124,58,237,0.35)' : 'transparent',
            color: lang === l ? '#fff' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.15s',
          }}
        >
          {label(l)}
        </button>
      ))}
    </div>
  );
}
