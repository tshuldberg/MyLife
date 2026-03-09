import type { ZodiacSign, MoonPhase, ZodiacElement } from '../types';

// ── Constants ─────────────────────────────────────────────────────────

/** Synodic period of the Moon in days. */
const SYNODIC_PERIOD = 29.53059;

/** Reference Julian date for new moon (Jan 6, 2000 18:14 UTC). */
const REFERENCE_NEW_MOON_JD = 2451550.1;

/**
 * Zodiac date boundaries as [month, day] pairs.
 * Each entry marks the START of that sign.
 */
const ZODIAC_BOUNDARIES: Array<{ sign: ZodiacSign; startMonth: number; startDay: number }> = [
  { sign: 'capricorn', startMonth: 12, startDay: 22 },
  { sign: 'aquarius', startMonth: 1, startDay: 20 },
  { sign: 'pisces', startMonth: 2, startDay: 19 },
  { sign: 'aries', startMonth: 3, startDay: 21 },
  { sign: 'taurus', startMonth: 4, startDay: 20 },
  { sign: 'gemini', startMonth: 5, startDay: 21 },
  { sign: 'cancer', startMonth: 6, startDay: 21 },
  { sign: 'leo', startMonth: 7, startDay: 23 },
  { sign: 'virgo', startMonth: 8, startDay: 23 },
  { sign: 'libra', startMonth: 9, startDay: 23 },
  { sign: 'scorpio', startMonth: 10, startDay: 23 },
  { sign: 'sagittarius', startMonth: 11, startDay: 22 },
];

const ELEMENT_MAP: Record<ZodiacSign, ZodiacElement> = {
  aries: 'fire',
  leo: 'fire',
  sagittarius: 'fire',
  taurus: 'earth',
  virgo: 'earth',
  capricorn: 'earth',
  gemini: 'air',
  libra: 'air',
  aquarius: 'air',
  cancer: 'water',
  scorpio: 'water',
  pisces: 'water',
};

/**
 * Major Arcana cards (22 cards, 0-21).
 * Suit is null for Major Arcana.
 */
const MAJOR_ARCANA: Array<{ name: string; number: number; suit: null }> = [
  { name: 'The Fool', number: 0, suit: null },
  { name: 'The Magician', number: 1, suit: null },
  { name: 'The High Priestess', number: 2, suit: null },
  { name: 'The Empress', number: 3, suit: null },
  { name: 'The Emperor', number: 4, suit: null },
  { name: 'The Hierophant', number: 5, suit: null },
  { name: 'The Lovers', number: 6, suit: null },
  { name: 'The Chariot', number: 7, suit: null },
  { name: 'Strength', number: 8, suit: null },
  { name: 'The Hermit', number: 9, suit: null },
  { name: 'Wheel of Fortune', number: 10, suit: null },
  { name: 'Justice', number: 11, suit: null },
  { name: 'The Hanged Man', number: 12, suit: null },
  { name: 'Death', number: 13, suit: null },
  { name: 'Temperance', number: 14, suit: null },
  { name: 'The Devil', number: 15, suit: null },
  { name: 'The Tower', number: 16, suit: null },
  { name: 'The Star', number: 17, suit: null },
  { name: 'The Moon', number: 18, suit: null },
  { name: 'The Sun', number: 19, suit: null },
  { name: 'Judgement', number: 20, suit: null },
  { name: 'The World', number: 21, suit: null },
];

const MINOR_SUITS = ['Wands', 'Cups', 'Swords', 'Pentacles'] as const;
const MINOR_NAMES = [
  'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King',
] as const;

// ── Date Helpers ──────────────────────────────────────────────────────

/**
 * Convert a calendar date string (YYYY-MM-DD) to Julian Day Number.
 * Uses the standard astronomical algorithm.
 */
function dateToJulianDay(dateStr: string): number {
  const parts = dateStr.split('-');
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Calculate the moon phase for a given date.
 * Uses the synodic period (29.53059 days) with a reference new moon Julian date.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns The current MoonPhase
 */
export function getMoonPhase(date: string): MoonPhase {
  const jd = dateToJulianDay(date);
  const daysSinceNew = jd - REFERENCE_NEW_MOON_JD;

  // Normalize to current cycle position (0 to 1)
  const cyclePosition = ((daysSinceNew % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD;
  const phaseAngle = (cyclePosition / SYNODIC_PERIOD) * 360;

  if (phaseAngle < 22.5) return 'new_moon';
  if (phaseAngle < 67.5) return 'waxing_crescent';
  if (phaseAngle < 112.5) return 'first_quarter';
  if (phaseAngle < 157.5) return 'waxing_gibbous';
  if (phaseAngle < 202.5) return 'full_moon';
  if (phaseAngle < 247.5) return 'waning_gibbous';
  if (phaseAngle < 292.5) return 'last_quarter';
  if (phaseAngle < 337.5) return 'waning_crescent';
  return 'new_moon';
}

/**
 * Determine the zodiac sign for a given birth date using standard zodiac boundaries.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns The ZodiacSign for that date
 */
export function getZodiacSign(date: string): ZodiacSign {
  const parts = date.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Convert to a "day of year" value for comparison (month * 100 + day).
  // Capricorn wraps around the year, so handle Dec 22+ first.
  const md = month * 100 + day;

  // Check Capricorn first (Dec 22 onward)
  if (md >= 1222) return 'capricorn';

  // Walk backwards through the remaining boundaries (Aquarius..Sagittarius).
  for (let i = ZODIAC_BOUNDARIES.length - 1; i >= 1; i--) {
    const b = ZODIAC_BOUNDARIES[i];
    const bmd = b.startMonth * 100 + b.startDay;
    if (md >= bmd) {
      return b.sign;
    }
  }

  // Before Jan 20 is also Capricorn
  return 'capricorn';
}

/**
 * Get the classical element for a zodiac sign.
 *
 * @param sign - The zodiac sign
 * @returns The element: fire, earth, air, or water
 */
export function getZodiacElement(sign: ZodiacSign): ZodiacElement {
  return ELEMENT_MAP[sign];
}

/**
 * Calculate compatibility between two zodiac signs using element-based scoring.
 *
 * Scoring rules:
 * - Same sign: 85
 * - Same element: 90
 * - Compatible elements (fire/air, earth/water): 75
 * - Neutral (same modality cross-element): 50
 * - Challenging (fire/water, earth/air): 40
 *
 * @param sign1 - First zodiac sign
 * @param sign2 - Second zodiac sign
 * @returns Compatibility score from 0 to 100
 */
export function calculateCompatibility(sign1: ZodiacSign, sign2: ZodiacSign): number {
  if (sign1 === sign2) return 85;

  const el1 = getZodiacElement(sign1);
  const el2 = getZodiacElement(sign2);

  if (el1 === el2) return 90;

  // Compatible pairs: fire+air, earth+water
  const compatible =
    (el1 === 'fire' && el2 === 'air') ||
    (el1 === 'air' && el2 === 'fire') ||
    (el1 === 'earth' && el2 === 'water') ||
    (el1 === 'water' && el2 === 'earth');

  if (compatible) return 75;

  // Challenging pairs: fire+water, earth+air, fire+earth, air+water
  return 40;
}

/**
 * Get the tarot card of the day for a given date.
 * Deterministic: the same date always produces the same card.
 * Cycles through all 78 cards (22 Major Arcana + 56 Minor Arcana).
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns The tarot card with name, number, and suit (null for Major Arcana)
 */
export function getTarotCardOfDay(date: string): { name: string; number: number; suit: string | null } {
  const jd = dateToJulianDay(date);
  // Use the Julian Day number to pick a card deterministically.
  // Total deck = 78 cards (22 major + 56 minor).
  const totalCards = 78;
  const index = ((Math.floor(jd) % totalCards) + totalCards) % totalCards;

  if (index < 22) {
    return MAJOR_ARCANA[index];
  }

  // Minor Arcana: 4 suits x 14 cards each
  const minorIndex = index - 22;
  const suitIndex = Math.floor(minorIndex / 14);
  const cardIndex = minorIndex % 14;

  return {
    name: `${MINOR_NAMES[cardIndex]} of ${MINOR_SUITS[suitIndex]}`,
    number: cardIndex + 1,
    suit: MINOR_SUITS[suitIndex],
  };
}
