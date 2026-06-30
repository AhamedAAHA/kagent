export type UserLanguage = 'en' | 'si' | 'tanglish';

/** Detect whether the user wrote in English, Sinhala script, or Tanglish (romanized Sinhala). */
export function detectUserLanguage(message: string): UserLanguage {
  if (/[\u0D80-\u0DFF]/.test(message)) return 'si';

  const tanglish =
    /\b(onna|dan|mata|api|oya|kiyala|denna|ewida|hinda|loku|podi|hari|naha|mama|amma|thatha|akka|malli|nangi|ayya|malli|ekak|ekata|tika|wage|karanna|one|dn|dnne|yanawa|gasa|nawa|rosa|mal\b|upadin|birthday\s*ekat|gift\s*ekak|denna\s*oni|colombo\s*ata)\b/i;
  if (tanglish.test(message)) return 'tanglish';

  return 'en';
}

export function conciergeLanguageInstructions(lang: UserLanguage): string {
  if (lang === 'si') {
    return `LANGUAGE: The user wrote in Sinhala (සිංහල). Reply primarily in Sinhala script. You may keep product names and prices in English/Latin. Be warm and local — like a Colombo friend helping with Kapruka.`;
  }
  if (lang === 'tanglish') {
    return `LANGUAGE: The user wrote in Tanglish (Sri Lankan romanized Sinhala + English mix, e.g. "amma ge birthday ekata roses denna oni"). Reply in the same Tanglish style — natural, casual, code-mixed. Do NOT reply in pure formal English unless clarifying a product name.`;
  }
  return `LANGUAGE: Reply in clear, warm English with a Sri Lankan local tone.`;
}

export function lifeEventLanguageNote(lang: UserLanguage): string {
  if (lang === 'si') return 'User message may be in Sinhala script — infer intent and output JSON tags in English for product search.';
  if (lang === 'tanglish') return 'User message may be Tanglish (e.g. "mama ge birthday ekata gift ekak") — infer intent and output JSON tags in English for Kapruka search.';
  return '';
}

/** Map Tanglish/Sinhala tokens to Kapruka-friendly English search terms. */
export function tanglishSearchTerms(message: string): string[] {
  const lower = message.toLowerCase();
  const terms: string[] = [];

  const rules: [RegExp, string][] = [
    [/rosa|ros\s*mal|රෝස/, 'roses'],
    [/mal\b|මල්|flowers/, 'flowers'],
    [/birthday|උපන්\s*දින|upadin/, 'birthday gift'],
    [/amma|mother|mummy/, 'mother gift'],
    [/appa|father|thatha/, 'father gift'],
    [/gift\s*ekak|tika\s*denna|denna\s*oni|තෑගි/, 'gift hamper'],
    [/cake|කේක්|keek/, 'birthday cake'],
    [/chocolate|චොකලට්/, 'chocolate gift'],
    [/party|hosting|සාදය/, 'party food'],
    [/avurudu|අවුරුද්ද/, 'avurudu gift'],
    [/vesak|වෙසක්/, 'vesak gift'],
    [/surprise/, 'gift surprise'],
    [/uni|university|varsity/, 'student gift'],
    [/moving|gasa\s*yana|නව\s*ගෙ/, 'home gift hamper'],
  ];

  for (const [pattern, term] of rules) {
    if (pattern.test(lower) || pattern.test(message)) terms.push(term);
  }

  return [...new Set(terms)];
}
