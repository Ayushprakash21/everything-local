import { describe, it, expect } from 'vitest';
import { LocationService, INDORE_NEIGHBORHOODS } from '../src/utils/location';
import { formatPaise, formatDistance, calculateDiscountPct } from '../src/utils/format';

describe('Mobile Utilities & Business Logic', () => {
  it('correctly formats integer paise to Indian Rupee currency string', () => {
    expect(formatPaise(29900)).toContain('299');
    expect(formatPaise(14500)).toContain('145');
    expect(formatPaise(0)).toContain('0');
  });

  it('calculates discount percentage accurately', () => {
    expect(calculateDiscountPct(26000, 23500)).toBe(10); // ~9.6% rounded to 10%
    expect(calculateDiscountPct(10000, 10000)).toBe(0);
    expect(calculateDiscountPct(5000, 6000)).toBe(0);
  });

  it('formats distance into user-friendly strings', () => {
    expect(formatDistance(0.4)).toBe('400 m away');
    expect(formatDistance(1.8)).toBe('1.8 km away');
    expect(formatDistance(undefined)).toBe('Nearby');
  });

  it('accurately computes distance between Indore landmarks using LocationService', () => {
    const palasia = INDORE_NEIGHBORHOODS.PALASIA;
    const saket = INDORE_NEIGHBORHOODS.SAKET;

    const dist = LocationService.calculateDistanceKm(
      palasia.latitude,
      palasia.longitude,
      saket.latitude,
      saket.longitude
    );

    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2.0);
  });
});
