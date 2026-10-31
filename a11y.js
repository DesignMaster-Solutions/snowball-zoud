// Accessibility settings for Snowball. No DOM: game.js and tests/a11y.test.mjs share it.
export const KEYS = ['large', 'contrast', 'calm', 'plain', 'mute'];
export const LABELS = { large: 'Large text', contrast: 'High contrast', calm: 'Calm speed', plain: 'Plain words', mute: 'Sound off' };
export const STORAGE_KEY = 'snowball.a11y';

// Saved settings first, then ?a11y=large,calm on top (a judge or teacher can link a mode).
export function parseSettings(search, stored) {
  const s = Object.fromEntries(KEYS.map(k => [k, false]));
  try { for (const k of KEYS) if (JSON.parse(stored || '{}')[k] === true) s[k] = true; } catch { /* broken storage = defaults */ }
  const q = new URLSearchParams(search).get('a11y');
  if (q !== null) for (const k of q.split(',')) if (KEYS.includes(k)) s[k] = true;
  return s;
}

export function toggle(s, key) { return { ...s, [key]: !s[key] }; }
export function serialize(s) { return JSON.stringify(s); }

export function fontPx(base, s) { return s.large ? Math.round(base * 1.3) : base; }
export function speedFactor(s) { return s.calm ? 0.7 : 1; }

// Plain words: finance words swapped for everyday ones; the numbers and the facts stay the same.
const PLAIN = [
  ['goes on a card at 24%', 'is borrowed at 24% a year'],
  ['on the card at 24%', 'borrowed at 24% a year'],
  ['on a card at 24%', 'borrowed at 24% a year'],
  ['Card interest you paid', 'Extra you paid for borrowing'],
  ['Card debt', 'Borrowed'],
  ['a $300k nest egg', '$300k of retirement money'],
  ['Nest egg', 'Retirement money'],
  ['nest egg', 'retirement money'],
  ['Employer match: free money', 'Your employer adds free money'],
  ['skills: they raise what you save each year', 'new skills: you earn more, so you save more each year'],
  ['It grows 6% a year.', 'It grows by 6% every year on its own.'],
  ['Past the goal, money adds nothing.', 'Saving more than the goal adds no points.'],
  ['+ security', '+ safety at 67'],
];
export function plain(text, s) {
  if (!s.plain) return text;
  let t = text;
  for (const [from, to] of PLAIN) t = t.split(from).join(to);
  return t;
}
