import { describe, expect, it } from 'vitest';
import { parseIngredientText } from '../ingredient-parser';

describe('parseIngredientText', () => {
  it('parses quantity, unit, and item', () => {
    const result = parseIngredientText('2 cups all-purpose flour');
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('cup');
    expect(result.item).toBe('all-purpose flour');
    expect(result.prepNote).toBeNull();
  });

  it('parses mixed numbers', () => {
    const result = parseIngredientText('1 1/2 cups sugar');
    expect(result.quantity).toBe(1.5);
    expect(result.unit).toBe('cup');
    expect(result.item).toBe('sugar');
  });

  it('extracts prep notes after a comma', () => {
    const result = parseIngredientText('2 cups all-purpose flour, sifted');
    expect(result.item).toBe('all-purpose flour');
    expect(result.prepNote).toBe('sifted');
  });

  it('handles size modifiers without explicit units', () => {
    const result = parseIngredientText('3 large eggs');
    expect(result.quantity).toBe(3);
    expect(result.unit).toBe('piece');
    expect(result.item).toBe('eggs');
    expect(result.prepNote).toBe('large');
  });

  it('handles unicode fractions', () => {
    const result = parseIngredientText('\u00BD cup milk');
    expect(result.quantity).toBe(0.5);
    expect(result.unit).toBe('cup');
    expect(result.item).toBe('milk');
  });
});
