const SYNONYMS: Record<string, string> = {
  scallion: 'green onion',
  'spring onion': 'green onion',
  capsicum: 'bell pepper',
  aubergine: 'eggplant',
  courgette: 'zucchini',
  coriander: 'cilantro',
  'bicarbonate of soda': 'baking soda',
  cornflour: 'cornstarch',
  'icing sugar': 'powdered sugar',
  'confectioners sugar': 'powdered sugar',
  'plain flour': 'all-purpose flour',
  'self raising flour': 'self-rising flour',
  'double cream': 'heavy cream',
  'single cream': 'light cream',
  rocket: 'arugula',
  'cos lettuce': 'romaine lettuce',
  'broad bean': 'fava bean',
  chickpea: 'garbanzo bean',
  garbanzo: 'garbanzo bean',
  prawn: 'shrimp',
  'caster sugar': 'superfine sugar',
  'rapeseed oil': 'canola oil',
  'groundnut oil': 'peanut oil',
  mangetout: 'snow pea',
  swede: 'rutabaga',
  beetroot: 'beet',
  'spring greens': 'collard greens',
  treacle: 'molasses',
  sultana: 'golden raisin',
  mince: 'ground beef',
  'stock cube': 'bouillon cube',
};

const PREP_WORDS = new Set([
  'chopped', 'diced', 'minced', 'sliced', 'crushed', 'grated',
  'shredded', 'peeled', 'seeded', 'julienned', 'cubed', 'halved',
  'quartered', 'torn', 'mashed', 'melted', 'softened', 'sifted',
  'packed', 'drained', 'rinsed', 'thawed', 'frozen', 'fresh',
  'dried', 'whole', 'crumbled', 'toasted', 'roasted',
]);

const SIZE_MODIFIERS = new Set([
  'large', 'small', 'medium', 'extra-large', 'extra', 'big', 'tiny',
]);

const ARTICLES = new Set(['a', 'an', 'the']);
const SIBILANT_ENDINGS = ['sh', 'ch', 'ss', 'zz', 'x'];
const NO_DEPLURALIZE = new Set([
  'molasses', 'hummus', 'couscous', 'asparagus', 'citrus', 'hibiscus',
]);

export function normalizeItemName(item: string): string {
  let normalized = item.toLowerCase().trim();
  normalized = normalized.replace(/\s+/g, ' ');
  let words = normalized.split(' ');

  while (words.length > 1 && ARTICLES.has(words[0])) {
    words.shift();
  }

  if (words.length > 1) {
    const filtered = words.filter(
      (word) => !PREP_WORDS.has(word) && !SIZE_MODIFIERS.has(word),
    );
    if (filtered.length > 0) {
      words = filtered;
    }
  }

  normalized = words.join(' ');
  return depluralize(normalized);
}

function depluralize(text: string): string {
  const words = text.split(' ');
  const last = words[words.length - 1];
  words[words.length - 1] = depluralizeWord(last);
  return words.join(' ');
}

function depluralizeWord(word: string): string {
  if (word.length <= 3) return word;
  if (NO_DEPLURALIZE.has(word)) return word;
  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.endsWith('ves') && word.length > 4) {
    return `${word.slice(0, -3)}f`;
  }
  if (word.endsWith('es') && word.length > 4) {
    const stem = word.slice(0, -2);
    if (SIBILANT_ENDINGS.some((ending) => stem.endsWith(ending))) {
      return stem;
    }
    if (word.endsWith('oes')) {
      return word.slice(0, -2);
    }
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

const NORMALIZED_SYNONYMS = new Map<string, string>();
for (const [key, value] of Object.entries(SYNONYMS)) {
  NORMALIZED_SYNONYMS.set(normalizeItemName(key), value);
}

export function resolveItemName(item: string): string {
  const normalized = normalizeItemName(item);
  const canonical = NORMALIZED_SYNONYMS.get(normalized);
  if (canonical !== undefined) {
    return normalizeItemName(canonical);
  }
  return normalized;
}

export function itemsMatch(left: string, right: string): boolean {
  return resolveItemName(left) === resolveItemName(right);
}

export function fuzzyItemMatch(ingredient: string, pantryItem: string): number {
  const left = resolveItemName(ingredient);
  const right = resolveItemName(pantryItem);
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.8;

  const leftWords = new Set(left.split(' '));
  const rightWords = new Set(right.split(' '));
  const shared = [...leftWords].filter((word) => rightWords.has(word)).length;
  const totalUnique = new Set([...leftWords, ...rightWords]).size;
  if (totalUnique > 0 && shared / totalUnique > 0.5) {
    return 0.6;
  }
  return 0;
}
