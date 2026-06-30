'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square } from 'lucide-react';
import { UserLanguage } from '@/lib/language';
import { isVoiceSupported, speechRecognitionLang } from '@/lib/voice';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: UserLanguage;
  labels?: {
    start?: string;
    stop?: string;
    unsupported?: string;
    denied?: string;
    error?: string;
  };
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export default function VoiceInput({ onTranscript, disabled, lang = 'en', labels = {} }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState('');
  const [hint, setHint] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    setSupported(isVoiceSupported());
  }, []);

  const flushTranscript = useCallback(() => {
    const text = transcriptRef.current.trim();
    transcriptRef.current = '';
    setInterim('');
    if (text) onTranscript(text);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
    flushTranscript();
  }, [flushTranscript]);

  const startListening = useCallback(async () => {
    if (disabled || !supported) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    setHint('');

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setHint(labels.denied ?? 'Microphone permission denied');
      return;
    }

    transcriptRef.current = '';
    setInterim('');

    const recognition = new SR();
    recognition.lang = speechRecognitionLang(lang);
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      let chunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript;
      }
      if (!chunk) return;

      if (e.results[e.results.length - 1]?.isFinal) {
        transcriptRef.current = `${transcriptRef.current} ${chunk}`.trim();
        setInterim(transcriptRef.current);
      } else {
        setInterim(`${transcriptRef.current} ${chunk}`.trim());
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setHint(labels.denied ?? 'Microphone permission denied');
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setHint(labels.error ?? 'Voice input failed — try again');
      }
      setListening(false);
      transcriptRef.current = '';
      setInterim('');
    };

    recognition.onend = () => {
      setListening(false);
      flushTranscript();
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setHint(labels.error ?? 'Could not start voice input');
      setListening(false);
    }
  }, [disabled, supported, lang, labels, flushTranscript]);

  useEffect(() => () => {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
  }, []);

  const title = !supported
    ? (labels.unsupported ?? 'Voice works in Chrome or Edge (HTTPS)')
    : listening
      ? (labels.stop ?? 'Stop listening')
      : (labels.start ?? 'Speak your request');

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        disabled={disabled || !supported}
        title={title}
        aria-label={title}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: listening ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${listening ? 'rgba(248,113,113,0.4)' : supported ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
          color: listening ? '#F87171' : supported ? '#A78BFA' : 'rgba(255,255,255,0.2)',
          cursor: disabled || !supported ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {listening ? (
          <>
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                background: 'rgba(248,113,113,0.1)',
              }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
            <Square size={13} fill="#F87171" />
          </>
        ) : (
          <Mic size={15} />
        )}
      </button>

      <AnimatePresence>
        {(interim || hint) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: '110%',
              right: 0,
              background: hint ? 'rgba(127,29,29,0.9)' : 'var(--surface2)',
              border: `1px solid ${hint ? 'rgba(248,113,113,0.4)' : 'rgba(124,58,237,0.3)'}`,
              borderRadius: 8,
              padding: '6px 10px',
              whiteSpace: 'nowrap',
              maxWidth: 260,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              color: hint ? '#FECACA' : 'rgba(255,255,255,0.7)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {hint ? `⚠ ${hint}` : `🎙 ${interim}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
