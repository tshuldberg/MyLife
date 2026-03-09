export const UNIT_CONVERSIONS: Record<string, { category: 'volume' | 'weight'; toBase: number }> = {
  tsp: { category: 'volume', toBase: 1 },
  tbsp: { category: 'volume', toBase: 3 },
  cup: { category: 'volume', toBase: 48 },
  pint: { category: 'volume', toBase: 96 },
  quart: { category: 'volume', toBase: 192 },
  gallon: { category: 'volume', toBase: 768 },
  ml: { category: 'volume', toBase: 1 / 4.929 },
  L: { category: 'volume', toBase: 1000 / 4.929 },
  oz: { category: 'weight', toBase: 1 },
  lb: { category: 'weight', toBase: 16 },
  g: { category: 'weight', toBase: 1 / 28.3495 },
  kg: { category: 'weight', toBase: 1000 / 28.3495 },
};

export function areUnitsCompatible(unitA: string | null, unitB: string | null): boolean {
  if (unitA === unitB) return true;
  if (!unitA || !unitB) return false;

  const a = UNIT_CONVERSIONS[unitA];
  const b = UNIT_CONVERSIONS[unitB];
  if (!a || !b) return false;
  return a.category === b.category;
}

export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number | null {
  if (fromUnit === toUnit) return quantity;

  const from = UNIT_CONVERSIONS[fromUnit];
  const to = UNIT_CONVERSIONS[toUnit];
  if (!from || !to || from.category !== to.category) return null;

  const baseValue = quantity * from.toBase;
  return baseValue / to.toBase;
}

const DISPLAY_RANGES: Record<string, { min: number; max: number }> = {
  tsp: { min: 0.25, max: 4 },
  tbsp: { min: 0.5, max: 4 },
  cup: { min: 0.25, max: 8 },
  quart: { min: 1, max: 8 },
  oz: { min: 0.5, max: 16 },
  lb: { min: 0.5, max: 10 },
};

export function bestDisplayUnit(
  baseValue: number,
  category: 'volume' | 'weight',
): { quantity: number; unit: string } {
  const units = category === 'volume' ? ['tsp', 'tbsp', 'cup', 'quart'] : ['oz', 'lb'];
  let best = { quantity: baseValue, unit: category === 'volume' ? 'tsp' : 'oz' };

  for (const unit of units) {
    const conversion = UNIT_CONVERSIONS[unit];
    const range = DISPLAY_RANGES[unit];
    if (!conversion || !range) continue;

    const quantity = baseValue / conversion.toBase;
    if (quantity >= range.min && quantity <= range.max) {
      best = { quantity, unit };
    }
  }

  return best;
}
