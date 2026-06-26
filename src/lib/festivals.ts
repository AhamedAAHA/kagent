import { Festival } from '@/types';

function daysUntil(month: number, day: number): number {
  const now = new Date();
  const year = now.getFullYear();
  let target = new Date(year, month - 1, day);
  if (target < now) target = new Date(year + 1, month - 1, day);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSriLankanFestivals(): Festival[] {
  const now = new Date();
  const year = now.getFullYear();

  const raw: Omit<Festival, 'daysUntil'>[] = [
    {
      id: 'avurudu',
      name: 'Sinhala & Tamil New Year',
      nameSinhala: 'සිංහල හා දෙමළ අලුත් අවුරුද්ද',
      date: new Date(year, 3, 13),
      category: 'cultural',
      suggestedCategories: ['festival', 'food', 'gifts', 'clothing'],
      greeting: 'Subha Aluth Awuruddak Wewa! 🎉',
    },
    {
      id: 'vesak',
      name: 'Vesak Poya',
      nameSinhala: 'වෙසක් පෝය',
      date: new Date(year, 4, 23),
      category: 'religious',
      suggestedCategories: ['festival', 'gifts', 'food'],
      greeting: 'Happy Vesak! May the Triple Gem bless you 🪔',
    },
    {
      id: 'christmas',
      name: 'Christmas',
      nameSinhala: 'නත්තල',
      date: new Date(year, 11, 25),
      category: 'cultural',
      suggestedCategories: ['gifts', 'festival', 'food'],
      greeting: 'Merry Christmas! 🎄',
    },
    {
      id: 'ramadan',
      name: 'Ramadan & Eid',
      nameSinhala: 'රාමදාන් සහ ඊද්',
      date: new Date(year, 2, 30),
      category: 'religious',
      suggestedCategories: ['festival', 'food', 'gifts'],
      greeting: 'Ramadan Mubarak! ✨',
    },
    {
      id: 'deepavali',
      name: 'Deepavali',
      nameSinhala: 'දීපාවලිය',
      date: new Date(year, 9, 20),
      category: 'cultural',
      suggestedCategories: ['festival', 'gifts', 'food'],
      greeting: 'Happy Deepavali! 🪔',
    },
    {
      id: 'independence',
      name: 'Independence Day',
      nameSinhala: 'නිදහස් දිනය',
      date: new Date(year, 1, 4),
      category: 'national',
      suggestedCategories: ['food', 'gifts'],
      greeting: 'Happy Independence Day, Sri Lanka! 🇱🇰',
    },
  ];

  return raw
    .map(f => {
      let date = new Date(f.date);
      if (date < now) date = new Date(date.setFullYear(year + 1));
      return { ...f, date, daysUntil: Math.ceil((date.getTime() - now.getTime()) / 86400000) };
    })
    .filter(f => f.daysUntil >= 0 && f.daysUntil <= 60)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getUpcomingFestival(): Festival | null {
  const festivals = getSriLankanFestivals();
  return festivals.length > 0 ? festivals[0] : null;
}

export function getFestivalContext(): string {
  const festivals = getSriLankanFestivals().slice(0, 2);
  if (festivals.length === 0) return '';
  return festivals
    .map(f => `${f.name} is in ${f.daysUntil} days (${f.greeting})`)
    .join('. ');
}
