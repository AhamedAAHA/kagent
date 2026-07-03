'use client';

import { ArrowRight, MessageSquare, Package, ShoppingBag, Sparkles } from 'lucide-react';
import { Agent } from '@/types';
import { QUICK_PROMPTS, UiLabels, quickPromptLabel } from '@/lib/ui-strings';
import { UserLanguage } from '@/lib/language';

type Props = {
  lang: UserLanguage;
  L: UiLabels;
  agents: Agent[];
  onTryPrompt: (msg: string) => void;
  onStartMission: () => void;
};

export default function MobileLandingSections({ lang, L, agents, onTryPrompt, onStartMission }: Props) {
  const steps = [
    { num: '01', title: L.mobileStep1Title, desc: L.mobileStep1Desc, icon: MessageSquare },
    { num: '02', title: L.mobileStep2Title, desc: L.mobileStep2Desc, icon: Sparkles },
    { num: '03', title: L.mobileStep3Title, desc: L.mobileStep3Desc, icon: ShoppingBag },
  ];

  return (
    <div className="mobile-landing-sections show-mobile-only">
      <p className="mobile-scroll-hint font-mono-custom">{L.mobileScrollHint}</p>

      <section className="mobile-section reveal-section">
        <p className="mobile-section-label font-mono-custom">{L.mobileHowItWorks}</p>
        <h2 className="mobile-section-title font-syncopate">{L.mobileHowTitle}</h2>
        <div className="mobile-steps">
          {steps.map((step) => (
            <div key={step.num} className="mobile-step">
              <div className="mobile-step-icon">
                <step.icon size={18} strokeWidth={1.5} />
              </div>
              <div>
                <div className="mobile-step-num font-mono-custom">{step.num}</div>
                <h3 className="mobile-step-title">{step.title}</h3>
                <p className="mobile-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mobile-section reveal-section">
        <p className="mobile-section-label font-mono-custom">{L.agents}</p>
        <h2 className="mobile-section-title font-syncopate">{L.mobileAgentsTitle}</h2>
        <p className="mobile-section-sub">{L.mobileAgentsSub}</p>
        <div className="mobile-agent-grid">
          {agents.map((a) => (
            <div key={a.id} className="mobile-agent-chip" style={{ borderColor: `${a.color}33` }}>
              <span className="mobile-agent-emoji">{a.emoji}</span>
              <span className="mobile-agent-name">{a.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mobile-section reveal-section">
        <p className="mobile-section-label font-mono-custom">{L.mobileTryLabel}</p>
        <h2 className="mobile-section-title font-syncopate">{L.mobileTryTitle}</h2>
        <p className="mobile-section-sub">{L.mobileTrySub}</p>
        <div className="mobile-prompt-cards">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.labelEn}
              type="button"
              className="mobile-prompt-card"
              onClick={() => onTryPrompt(q.msg)}
            >
              <span className="mobile-prompt-icon">{q.icon}</span>
              <span className="mobile-prompt-text">
                <span className="mobile-prompt-label">{quickPromptLabel(q, lang)}</span>
                <span className="mobile-prompt-msg font-mono-custom">{q.msg}</span>
              </span>
              <ArrowRight size={14} className="mobile-prompt-arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="mobile-section reveal-section mobile-lang-section">
        <p className="mobile-section-label font-mono-custom">{L.mobileLangLabel}</p>
        <div className="mobile-lang-pills">
          <span className="mobile-lang-pill active">{L.langEn}</span>
          <span className="mobile-lang-pill">{L.langSi}</span>
          <span className="mobile-lang-pill">{L.langTg}</span>
        </div>
        <p className="mobile-lang-note">{L.mobileLangNote}</p>
      </section>

      <section className="mobile-section reveal-section mobile-track-section">
        <div className="mobile-track-card">
          <Package size={20} strokeWidth={1.5} />
          <div>
            <h3 className="mobile-track-title">{L.trackOrder}</h3>
            <p className="mobile-track-desc">{L.mobileTrackDesc}</p>
          </div>
        </div>
        <button type="button" className="mobile-mission-cta font-syncopate" onClick={onStartMission}>
          {L.startMission} <ArrowRight size={12} />
        </button>
      </section>

      <footer className="mobile-landing-footer reveal-section font-mono-custom">
        <p>{L.mobileFooter}</p>
        <p className="mobile-footer-sub">NUPP5 · Kapruka Agent Challenge 2026</p>
      </footer>
    </div>
  );
}
