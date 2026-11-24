import { describe, it, expect } from 'vitest';
import { validateIsolation, EnvironmentBindings } from '../scripts/validate-environments';

describe('Cloudflare Environment Isolation & Boundary Protection Tests', () => {
  const validProduction: EnvironmentBindings = {
    workerName: 'everything-local-api',
    d1DatabaseName: 'everything-local-db',
    d1DatabaseId: '39a50b18-37a7-42f5-92eb-0983caeaf914',
    r2BucketName: 'everything-local-media',
    kvNamespaceId: 'cca418a4d3fd487db664bf67677e5d08'
  };

  const validDevelopment: EnvironmentBindings = {
    workerName: 'everybazaar-api-dev',
    d1DatabaseName: 'everybazaar-dev-db',
    d1DatabaseId: 'f24dbc3e-73a1-4c6c-a1ad-3743800795fd',
    r2BucketName: 'everybazaar-dev-media',
    kvNamespaceId: '140a330b6e174280802c0b7ad577d86c'
  };

  const validStaging: EnvironmentBindings = {
    workerName: 'everybazaar-api-staging',
    d1DatabaseName: 'everybazaar-staging-db',
    d1DatabaseId: 'd182b8dd-6748-4453-bfd6-189d1b206780',
    r2BucketName: 'everybazaar-staging-media',
    kvNamespaceId: 'a8c2e1585e804de7888b42ff6586d098'
  };

  it('1. Confirms 100% PASS on strictly isolated Production, Development and Staging bindings', () => {
    const result = validateIsolation({
      production: validProduction,
      development: validDevelopment,
      staging: validStaging
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('2. Fails closed if Development accidentally uses Production D1 database ID', () => {
    const leakyDev: EnvironmentBindings = {
      ...validDevelopment,
      d1DatabaseId: validProduction.d1DatabaseId
    };

    const result = validateIsolation({
      production: validProduction,
      development: leakyDev,
      staging: validStaging
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Development D1 ID'))).toBe(true);
  });

  it('3. Fails closed if Development accidentally uses Production R2 bucket', () => {
    const leakyDev: EnvironmentBindings = {
      ...validDevelopment,
      r2BucketName: validProduction.r2BucketName
    };

    const result = validateIsolation({
      production: validProduction,
      development: leakyDev,
      staging: validStaging
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Development R2 bucket'))).toBe(true);
  });

  it('4. Fails closed if Development accidentally uses Production KV namespace ID', () => {
    const leakyDev: EnvironmentBindings = {
      ...validDevelopment,
      kvNamespaceId: validProduction.kvNamespaceId
    };

    const result = validateIsolation({
      production: validProduction,
      development: leakyDev,
      staging: validStaging
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Development KV ID'))).toBe(true);
  });

  it('5. Fails closed if Staging shares any resource with Production or Development', () => {
    const leakyStaging: EnvironmentBindings = {
      ...validStaging,
      d1DatabaseId: validProduction.d1DatabaseId,
      r2BucketName: validDevelopment.r2BucketName
    };

    const result = validateIsolation({
      production: validProduction,
      development: validDevelopment,
      staging: leakyStaging
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
