'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'en-LK';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setInterim(interimText || finalText);
      if (finalText) {
        onTranscript(finalText.trim());
        setListening(false);
        setInterim('');
      }
    };

    recognition.onerror = () => { setListening(false); setInterim(''); };
    recognition.onend = () => { setListening(false); };

    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim('');
  }

  if (!supported) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: listening ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${listening ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.09)'}`,
          color: listening ? '#F87171' : 'rgba(255,255,255,0.4)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', flexShrink: 0,
          position: 'relative', overflow: 'hidden',
        }}
      >
        {listening ? (
          <>
            <motion.div
              style={{
                position: 'absolute', inset: 0, borderRadius: 10,
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

      {/* Interim transcript tooltip */}
      <AnimatePresence>
        {interim && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', bottom: '110%', right: 0,
              background: 'var(--surface2)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '6px 10px', whiteSpace: 'nowrap',
              maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis',
              fontFamily: 'Inter, sans-serif', fontSize: 11,
              color: 'rgba(255,255,255,0.7)', pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            🎙 {interim}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
