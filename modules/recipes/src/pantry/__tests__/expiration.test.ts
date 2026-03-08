import { describe, expect, it } from 'vitest';
import {
  classifyExpiration,
  daysUntilExpiration,
  getExpirationColor,
  getExpirationLabel,
} from '../expiration';

const makeLocalDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

describe('expiration helpers', () => {
  const now = makeLocalDate(2026, 3, 1);

  it('classifies fresh, expiring soon, and expired dates', () => {
    expect(classifyExpiration('2026-03-11', now)).toBe('fresh');
    expect(classifyExpiration('2026-03-03', now)).toBe('expiring_soon');
    expect(classifyExpiration('2026-02-28', now)).toBe('expired');
  });

  it('computes days until expiration', () => {
    expect(daysUntilExpiration('2026-03-06', now)).toBe(5);
    expect(daysUntilExpiration('2026-03-01', now)).toBe(0);
  });

  it('maps display colors and labels', () => {
    expect(getExpirationColor('fresh')).toBe('#4ECDC4');
    expect(getExpirationLabel('expiring_soon', 2)).toBe('Expiring soon (2 days left)');
  });
});
