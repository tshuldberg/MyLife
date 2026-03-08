import { describe, it, expect } from 'vitest';
import { convertUnit, areUnitsCompatible } from '../units';

describe('areUnitsCompatible', () => {
  it('returns true for same unit', () => {
    expect(areUnitsCompatible('cup', 'cup')).toBe(true);
  });

  it('returns true for compatible volume units', () => {
    expect(areUnitsCompatible('tsp', 'tbsp')).toBe(true);
    expect(areUnitsCompatible('tbsp', 'cup')).toBe(true);
    expect(areUnitsCompatible('cup', 'quart')).toBe(true);
  });

  it('returns true for compatible weight units', () => {
    expect(areUnitsCompatible('oz', 'lb')).toBe(true);
    expect(areUnitsCompatible('g', 'kg')).toBe(true);
  });

  it('returns false for incompatible units', () => {
    expect(areUnitsCompatible('cup', 'lb')).toBe(false);
    expect(areUnitsCompatible('tsp', 'oz')).toBe(false);
  });

  it('returns false when either unit is null', () => {
    expect(areUnitsCompatible(null, 'cup')).toBe(false);
    expect(areUnitsCompatible('cup', null)).toBe(false);
  });

  it('returns true when both units are null', () => {
    expect(areUnitsCompatible(null, null)).toBe(true);
  });

  it('returns false for unknown units', () => {
    expect(areUnitsCompatible('clove', 'cup')).toBe(false);
  });
});

describe('convertUnit', () => {
  it('converts tsp to tbsp', () => {
    const result = convertUnit(3, 'tsp', 'tbsp');
    expect(result).toBeCloseTo(1, 2);
  });

  it('converts tbsp to cup', () => {
    const result = convertUnit(16, 'tbsp', 'cup');
    expect(result).toBeCloseTo(1, 2);
  });

  it('converts cup to quart', () => {
    const result = convertUnit(4, 'cup', 'quart');
    expect(result).toBeCloseTo(1, 2);
  });

  it('converts oz to lb', () => {
    const result = convertUnit(16, 'oz', 'lb');
    expect(result).toBeCloseTo(1, 2);
  });

  it('returns null for incompatible units', () => {
    expect(convertUnit(1, 'cup', 'lb')).toBeNull();
  });

  it('returns same quantity for same unit', () => {
    expect(convertUnit(2, 'cup', 'cup')).toBe(2);
  });

  it('converts 4 tbsp to 1/4 cup', () => {
    const result = convertUnit(4, 'tbsp', 'cup');
    expect(result).toBeCloseTo(0.25, 2);
  });
});
