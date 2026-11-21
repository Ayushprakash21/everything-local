import { describe, it, expect } from 'vitest';

describe('Loyalty & Referral Rewards Engine', () => {
  it('prevents user from applying own referral code', () => {
    const userReferral = 'INDORE-AYUSH-100';
    const validateCode = (code: string) => {
      if (code.toUpperCase() === userReferral) {
        return { valid: false, reason: 'Self-referral is disallowed' };
      }
      return { valid: true, bonusPoints: 100 };
    };

    expect(validateCode('INDORE-AYUSH-100').valid).toBe(false);
    expect(validateCode('INDORE-PATIDAR-200').valid).toBe(true);
  });

  it('calculates points redemption into integer paise discount', () => {
    const redeem = (points: number, ratePaisePerPoint: number = 25) => {
      return points * ratePaisePerPoint;
    };

    // 200 points at 25 paise = 5000 paise (₹50.00 discount)
    expect(redeem(200)).toBe(5000);
    // 400 points = 10000 paise (₹100.00 discount)
    expect(redeem(400)).toBe(10000);
  });
});
