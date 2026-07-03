'use client';

import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useMobileGsap(scopeRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = scopeRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isPhone: '(max-width: 899px)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isPhone, reduceMotion } = context.conditions ?? {};
        if (!isPhone || reduceMotion) return;

        const ctx = gsap.context(() => {
          const progress = el.querySelector<HTMLElement>('.scroll-progress-bar');
          if (progress) {
            gsap.fromTo(
              progress,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: el,
                  start: 'top top',
                  end: 'bottom bottom',
                  scrub: 0.25,
                },
              },
            );
          }

          gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
            gsap.from(section, {
              opacity: 0,
              y: 36,
              duration: 0.65,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            });
          });

          const steps = el.querySelector('.mobile-steps');
          if (steps) {
            gsap.from(steps.querySelectorAll('.mobile-step'), {
              opacity: 0,
              x: -20,
              stagger: 0.1,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: { trigger: steps, start: 'top 85%' },
            });
          }

          const agentGrid = el.querySelector('.mobile-agent-grid');
          if (agentGrid) {
            gsap.from(agentGrid.querySelectorAll('.mobile-agent-chip'), {
              opacity: 0,
              y: 18,
              scale: 0.94,
              stagger: 0.06,
              duration: 0.45,
              ease: 'power2.out',
              scrollTrigger: { trigger: agentGrid, start: 'top 85%' },
            });
          }

          const prompts = el.querySelector('.mobile-prompt-cards');
          if (prompts) {
            gsap.from(prompts.querySelectorAll('.mobile-prompt-card'), {
              opacity: 0,
              y: 22,
              stagger: 0.08,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: { trigger: prompts, start: 'top 88%' },
            });
          }
        }, el);

        return () => ctx.revert();
      },
    );

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const t = window.setTimeout(refresh, 400);

    return () => {
      window.removeEventListener('load', refresh);
      window.clearTimeout(t);
      mm.revert();
    };
  }, [scopeRef]);
}
