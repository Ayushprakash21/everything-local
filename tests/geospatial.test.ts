import { describe, it, expect } from 'vitest';
import { GeospatialEngine } from '../server/src/core/geospatial';

describe('Geospatial Engine & Serviceability (Indore Market)', () => {
  it('accurately calculates Haversine distance between Indore coordinates', () => {
    const palasia = GeospatialEngine.INDORE_LANDMARKS.PALASIA;
    const saket = GeospatialEngine.INDORE_LANDMARKS.SAKET;

    // Palasia to Saket is roughly 1.1 - 1.3 km
    const distance = GeospatialEngine.calculateDistanceKm(palasia, saket);
    expect(distance).toBeGreaterThan(0.8);
    expect(distance).toBeLessThan(1.6);
  });

  it('enforces 3.0 km serviceability cutoff for delivery', () => {
    const palasia = GeospatialEngine.INDORE_LANDMARKS.PALASIA;
    const saket = GeospatialEngine.INDORE_LANDMARKS.SAKET;

    // Within 3km
    const resultNear = GeospatialEngine.evaluateServiceability(palasia, saket, 3.0);
    expect(resultNear.isServiceable).toBe(true);
    expect(resultNear.isPickupAvailable).toBe(true);

    // Far location (>3km) e.g. Palasia to Bhawarkua ~3.9km
    const bhawarkua = GeospatialEngine.INDORE_LANDMARKS.BHAWARKUA;
    const resultFar = GeospatialEngine.evaluateServiceability(palasia, bhawarkua, 3.0);
    expect(resultFar.isServiceable).toBe(false);
    expect(resultFar.reason).toContain('exceeds the delivery radius');
    // But pickup remains available!
    expect(resultFar.isPickupAvailable).toBe(true);
  });
});
