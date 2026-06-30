import { UserLanguage } from './language';

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function speechRecognitionLang(lang: UserLanguage): string {
  if (lang === 'si') return 'si-LK';
  return 'en-LK';
}
