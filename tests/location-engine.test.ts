import { describe, it, expect, beforeAll } from 'vitest';
import { IndoreLocationEngine } from '../server/src/core/locationEngine';
import { GeospatialEngine } from '../server/src/core/geospatial';
import app from '../server/src/index';
import request from 'supertest';

describe('Indore Location Engine & Geocoding Service', () => {
  it('1. Reverse-geocodes Palasia coordinates accurately', async () => {
    const palasiaCoord = { latitude: 22.7244, longitude: 75.8839 };
    const result = await IndoreLocationEngine.reverseGeocode(palasiaCoord);
    expect(result.locality).toBe('Palasia');
    expect(result.city).toBe('Indore');
    expect(result.pincode).toBe('452001');
    expect(result.state).toBe('Madhya Pradesh');
  });

  it('2. Reverse-geocodes Vijay Nagar coordinates accurately', async () => {
    const vijayNagarCoord = { latitude: 22.7533, longitude: 75.8937 };
    const result = await IndoreLocationEngine.reverseGeocode(vijayNagarCoord);
    expect(result.locality).toBe('Vijay Nagar');
    expect(result.city).toBe('Indore');
    expect(result.pincode).toBe('452010');
  });

  it('3. Reverse-geocodes Rau coordinates accurately', async () => {
    const rauCoord = { latitude: 22.6288, longitude: 75.8115 };
    const result = await IndoreLocationEngine.reverseGeocode(rauCoord);
    expect(result.locality).toBe('Rau');
    expect(result.city).toBe('Indore');
    expect(result.pincode).toBe('453331');
  });

  it('4. Reverse-geocodes Bhawarkua coordinates accurately', async () => {
    const bhawarkuaCoord = { latitude: 22.6926, longitude: 75.8676 };
    const result = await IndoreLocationEngine.reverseGeocode(bhawarkuaCoord);
    expect(result.locality).toBe('Bhawarkua');
    expect(result.city).toBe('Indore');
    expect(result.pincode).toBe('452014');
  });

  it('5. Searches for arbitrary Indore localities (Bengali Square, Scheme 54, Khajrana, Super Corridor)', async () => {
    const queries = ['Bengali Square', 'Scheme 54', 'Khajrana', 'Super Corridor', 'Sudama Nagar'];
    for (const q of queries) {
      const results = await IndoreLocationEngine.searchAddresses(q);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].city).toBe('Indore');
    }
  });

  it('6. Searches using PIN code 452010 and 452001', async () => {
    const pin10Results = await IndoreLocationEngine.searchAddresses('452010');
    expect(pin10Results.length).toBeGreaterThan(0);
    expect(pin10Results.some((r) => r.pincode === '452010')).toBe(true);

    const pin01Results = await IndoreLocationEngine.searchAddresses('452001');
    expect(pin01Results.length).toBeGreaterThan(0);
    expect(pin01Results.some((r) => r.pincode === '452001')).toBe(true);
  });

  it('7. Calculates distance accurately and detects out-of-coverage addresses', () => {
    const palasiaStore = { latitude: 22.7244, longitude: 75.8839 };
    const rauCustomer = { latitude: 22.6288, longitude: 75.8115 };
    const distanceKm = GeospatialEngine.calculateDistanceKm(palasiaStore, rauCustomer);

    // Rau is ~13-14 km away from Palasia
    expect(distanceKm).toBeGreaterThan(10);

    const serviceability = GeospatialEngine.evaluateServiceability(palasiaStore, rauCustomer, 3.0);
    expect(serviceability.isServiceable).toBe(false);
    expect(serviceability.isPickupAvailable).toBe(true);
    expect(serviceability.reason).toContain('exceeds the delivery radius of 3 km');
  });
});

describe('Location & Address API Endpoints', () => {
  it('GET /api/location/localities returns curated popular hubs', async () => {
    const res = await request(app).get('/api/location/localities');
    expect(res.status).toBe(200);
    expect(res.body.localities).toBeDefined();
    expect(res.body.localities.length).toBeGreaterThanOrEqual(10);
  });

  it('GET /api/location/search?q=Vijay Nagar returns matching localities', async () => {
    const res = await request(app).get('/api/location/search?q=Vijay%20Nagar');
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0].name).toContain('Vijay Nagar');
  });

  it('GET /api/location/reverse?lat=22.7244&lng=75.8839 returns Palasia', async () => {
    const res = await request(app).get('/api/location/reverse?lat=22.7244&lng=75.8839');
    expect(res.status).toBe(200);
    expect(res.body.address.locality).toBe('Palasia');
    expect(res.body.address.pincode).toBe('452001');
  });

  it('GET /api/location/serviceability checks delivery coverage', async () => {
    const res = await request(app).get('/api/location/serviceability?lat=22.7244&lng=75.8839');
    expect(res.status).toBe(200);
    expect(res.body.deliveryEta).toBeDefined();
    expect(res.body.stores).toBeDefined();
  });
});
