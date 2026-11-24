import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';

describe('Sprint 9: Merchant Paid Advertising Engine', () => {
  let merchantToken: string;
  let adminToken: string;
  let storeId: string;
  let campaignId: string;

  beforeAll(async () => {
    // 1. Login merchant
    const merchRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'sharma.kirana@everythinglocal.in', password: 'Password@123' });
    merchantToken = merchRes.body.token;
    storeId = merchRes.body.user.store.id;

    // 2. Login admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    adminToken = adminRes.body.token;
  });

  it('allows merchant to create an ad campaign with valid budget parameters', async () => {
    const res = await request(app)
      .post('/api/merchant/ads')
      .set('Authorization', `Bearer ${merchantToken}`)
      .set('x-store-id', storeId)
      .send({
        title: 'Diwali Grocery Festive Splash',
        placement: 'HERO_BANNER',
        headline: 'Save ₹100 on Fresh Staples in Palasia',
        description: 'Exclusive 15-minute quick delivery on cold-pressed mustard oil and premium basmati rice.',
        dailyBudgetPaise: 10000, // ₹100/day
        totalBudgetPaise: 50000, // ₹500 total
        pricingModel: 'CPC',
        durationDays: 5
      });

    expect(res.status).toBe(201);
    expect(res.body.campaign).toBeDefined();
    expect(res.body.campaign.status).toBe('PENDING_APPROVAL');
    expect(res.body.campaign.title).toBe('Diwali Grocery Festive Splash');

    campaignId = res.body.campaign.id;
  });

  it('lists merchant ad campaigns for the authenticated store', async () => {
    const res = await request(app)
      .get('/api/merchant/ads')
      .set('Authorization', `Bearer ${merchantToken}`)
      .set('x-store-id', storeId);

    expect(res.status).toBe(200);
    expect(res.body.campaigns.length).toBeGreaterThanOrEqual(1);
    const found = res.body.campaigns.find((c: any) => c.id === campaignId);
    expect(found).toBeDefined();
  });

  it('allows platform admin to review and approve submitted ad campaign', async () => {
    const res = await request(app)
      .patch(`/api/admin/ads/${campaignId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.campaign.status).toBe('ACTIVE');
  });

  it('calculates campaign performance metrics and CTR honestly without fabricated data', async () => {
    const res = await request(app)
      .get(`/api/merchant/ads/${campaignId}/analytics`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .set('x-store-id', storeId);

    expect(res.status).toBe(200);
    expect(res.body.campaignId).toBe(campaignId);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.impressions).toBe(0);
    expect(res.body.metrics.clicks).toBe(0);
    expect(res.body.metrics.ctrPct).toBe(0);
    expect(res.body.metrics.remainingBudgetPaise).toBe(50000);
  });
});
