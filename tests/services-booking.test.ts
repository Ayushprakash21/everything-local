import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';

describe('Everything Local — Local Services Booking Ecosystem Test Suite', () => {
  let customerToken: string;
  let customer2Token: string;
  let salonProviderToken: string;
  let adminToken: string;

  let salonProviderId: string;
  let haircutServiceId: string;
  let electricProviderId: string;
  let electricServiceId: string;

  let salonBookingId: string;
  let homeHaircutBookingId: string;
  let electricBookingId: string;

  beforeAll(async () => {
    // Clean up test bookings to guarantee test idempotency
    await prisma.serviceReview.deleteMany();
    await prisma.bookingStatusEvent.deleteMany();
    await prisma.providerEarning.deleteMany({ where: { bookingId: { not: null } } });
    await prisma.serviceBooking.deleteMany();

    // 1. Authenticate Customer 1 (Ayush)
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = custRes.body.token;

    // 2. Authenticate Customer 2 (Priya)
    let cust2Res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'priya@example.com', password: 'Password@123' });
    if (cust2Res.status !== 200) {
      cust2Res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'priya@example.com',
          name: 'Priya Verma',
          password: 'Password@123',
          phone: '9893000099',
          role: 'CUSTOMER'
        });
    }
    customer2Token = cust2Res.body.token;

    // 3. Authenticate Salon Provider
    const provRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'glamour.salon@everythinglocal.in', password: 'Password@123' });
    salonProviderToken = provRes.body.token;

    // 4. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    adminToken = adminRes.body.token;

    // Fetch Providers & Services
    const provListRes = await request(app).get('/api/services/providers');
    expect(provListRes.status).toBe(200);
    expect(provListRes.body.providers.length).toBeGreaterThan(0);

    const salon = provListRes.body.providers.find((p: any) =>
      p.businessName.toLowerCase().includes('glamour')
    );
    expect(salon).toBeDefined();
    salonProviderId = salon.id;

    // Get Salon Detail & Services
    const salonDetailRes = await request(app).get(`/api/services/providers/${salonProviderId}`);
    expect(salonDetailRes.status).toBe(200);
    const haircut = salonDetailRes.body.provider.services.find((s: any) =>
      s.title.toLowerCase().includes('haircut')
    );
    expect(haircut).toBeDefined();
    haircutServiceId = haircut.id;

    // Find Electrician Provider
    const electric = provListRes.body.providers.find((p: any) =>
      p.businessName.toLowerCase().includes('quickfix')
    );
    expect(electric).toBeDefined();
    electricProviderId = electric.id;

    const electricDetailRes = await request(app).get(`/api/services/providers/${electricProviderId}`);
    expect(electricDetailRes.status).toBe(200);
    const electricSvc = electricDetailRes.body.provider.services[0];
    expect(electricSvc).toBeDefined();
    electricServiceId = electricSvc.id;
  }, 30000);

  // Scenario 1: Customer books a salon shop appointment
  it('Scenario 1: Customer books a salon shop appointment (SHOP_VISIT)', async () => {
    const res = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerId: salonProviderId,
        serviceId: haircutServiceId,
        fulfillmentType: 'SHOP_VISIT',
        bookingDate: '2026-12-01',
        timeSlot: '10:00 AM',
        instructions: 'Prefer Senior Stylist Rahul'
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.bookingNumber).toContain('BKG-IND-');
    expect(res.body.booking.fulfillmentType).toBe('SHOP_VISIT');
    expect(res.body.booking.travelFeePaise).toBe(0);
    expect(res.body.booking.status).toBe('CONFIRMED');

    salonBookingId = res.body.booking.id;
  });

  // Scenario 2: Customer books a home visit haircut
  it('Scenario 2: Customer books a home visit haircut with travel fee calculation', async () => {
    const res = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerId: salonProviderId,
        serviceId: haircutServiceId,
        fulfillmentType: 'HOME_VISIT',
        bookingDate: '2026-12-01',
        timeSlot: '02:30 PM',
        customerAddressLine: 'Flat 402, Shalimar Palms, Vijay Nagar',
        customerLocality: 'Vijay Nagar',
        customerCity: 'Indore',
        customerLat: 22.7533,
        customerLng: 75.8937,
        instructions: 'Please call before arriving'
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.fulfillmentType).toBe('HOME_VISIT');
    expect(res.body.booking.travelFeePaise).toBe(4900); // Provider configured travel fee (₹49)
    expect(res.body.booking.totalAmountPaise).toBe(res.body.booking.serviceFeePaise + 4900);

    homeHaircutBookingId = res.body.booking.id;
  });

  // Scenario 3: Customer books an electrician
  it('Scenario 3: Customer books an electrician for home electrical service', async () => {
    const res = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerId: electricProviderId,
        serviceId: electricServiceId,
        fulfillmentType: 'HOME_VISIT',
        bookingDate: '2026-12-02',
        timeSlot: '11:00 AM',
        customerAddressLine: '12 Main Road, Saket Nagar',
        customerLocality: 'Saket Nagar',
        customerCity: 'Indore',
        customerLat: 22.7150,
        customerLng: 75.8900,
        instructions: 'Circuit breaker tripping repeatedly'
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.providerId).toBe(electricProviderId);

    electricBookingId = res.body.booking.id;
  });

  // Scenario 4: Provider accepts/confirms booking
  it('Scenario 4: Provider updates booking status to in-progress and completed', async () => {
    const statusRes = await request(app)
      .post(`/api/services/provider/bookings/${salonBookingId}/status`)
      .set('Authorization', `Bearer ${salonProviderToken}`)
      .send({
        status: 'IN_PROGRESS',
        note: 'Customer seated and haircut started'
      });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.booking.status).toBe('IN_PROGRESS');

    // Complete booking
    const completeRes = await request(app)
      .post(`/api/services/provider/bookings/${salonBookingId}/status`)
      .set('Authorization', `Bearer ${salonProviderToken}`)
      .send({
        status: 'COMPLETED',
        note: 'Haircut service completed successfully'
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.booking.status).toBe('COMPLETED');
  });

  // Scenario 5: Provider rejects booking
  it('Scenario 5: Provider rejects a booking request', async () => {
    // Create temporary booking to reject
    const tempRes = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerId: salonProviderId,
        serviceId: haircutServiceId,
        fulfillmentType: 'SHOP_VISIT',
        bookingDate: '2026-12-05',
        timeSlot: '05:30 PM'
      });
    expect(tempRes.status).toBe(201);
    const tempBookingId = tempRes.body.booking.id;

    const rejectRes = await request(app)
      .post(`/api/services/provider/bookings/${tempBookingId}/status`)
      .set('Authorization', `Bearer ${salonProviderToken}`)
      .send({
        status: 'REJECTED',
        note: 'Salon fully occupied for a private bridal event during this slot'
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.booking.status).toBe('REJECTED');
  });

  // Scenario 6: Customer cancels and reschedules booking
  it('Scenario 6: Customer cancels and reschedules booking', async () => {
    // 6.1 Reschedule home haircut booking to a new time
    const reschedRes = await request(app)
      .post(`/api/services/bookings/${homeHaircutBookingId}/reschedule`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingDate: '2026-12-03',
        timeSlot: '04:30 PM'
      });

    expect(reschedRes.status).toBe(200);
    expect(reschedRes.body.booking.bookingDate).toBe('2026-12-03');
    expect(reschedRes.body.booking.timeSlot).toBe('04:30 PM');

    // 6.2 Customer cancels booking
    const cancelRes = await request(app)
      .post(`/api/services/bookings/${homeHaircutBookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        reason: 'Change of schedule for family function'
      });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.booking.status).toBe('CANCELLED');
  });

  // Scenario 7: Concurrency test: Two customers attempt the same appointment slot
  it('Scenario 7: Concurrency test prevents duplicate reservations on same slot', async () => {
    const targetDate = '2026-12-10';
    const targetSlot = '11:00 AM';

    // First customer reserves slot
    const firstRes = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerId: salonProviderId,
        serviceId: haircutServiceId,
        fulfillmentType: 'SHOP_VISIT',
        bookingDate: targetDate,
        timeSlot: targetSlot
      });
    expect(firstRes.status).toBe(201);

    // Second customer attempts the exact same provider, date and slot
    const secondRes = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        providerId: salonProviderId,
        serviceId: haircutServiceId,
        fulfillmentType: 'SHOP_VISIT',
        bookingDate: targetDate,
        timeSlot: targetSlot
      });

    expect(secondRes.status).toBe(400);
    expect(secondRes.body.error).toMatch(/slot has just been reserved/i);
  });

  // Scenario 8: Customer outside provider's homeVisitRadiusKm is blocked
  it('Scenario 8: Customer outside provider homeVisitRadiusKm is blocked with 400', async () => {
    // Salon has 8 km radius in Vijay Nagar. Rau / Pithampur (25 km away) must be rejected
    const outOfBoundsRes = await request(app)
      .post('/api/services/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerId: salonProviderId,
        serviceId: haircutServiceId,
        fulfillmentType: 'HOME_VISIT',
        bookingDate: '2026-12-12',
        timeSlot: '01:00 PM',
        customerAddressLine: 'Sector 3, Pithampur Industrial Area',
        customerLocality: 'Pithampur',
        customerCity: 'Indore',
        customerLat: 22.6100, // ~25 km away from Vijay Nagar
        customerLng: 75.6800
      });

    expect(outOfBoundsRes.status).toBe(400);
    expect(outOfBoundsRes.body.error).toMatch(/exceeds the provider's home visit radius/i);
  });

  // Scenario 9: Admin approves/verifies a new provider
  it('Scenario 9: Admin approves/verifies a provider and lists bookings', async () => {
    // 9.1 Admin updates provider status
    const verifyRes = await request(app)
      .post(`/api/services/admin/providers/${salonProviderId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'VERIFIED' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.provider.verificationStatus).toBe('VERIFIED');

    // 9.2 Admin inspects marketplace bookings
    const bookingsRes = await request(app)
      .get('/api/services/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(bookingsRes.status).toBe(200);
    expect(bookingsRes.body.bookings.length).toBeGreaterThan(0);
    expect(bookingsRes.body.stats.totalBookings).toBeGreaterThan(0);
    expect(bookingsRes.body.stats.totalPlatformRevenuePaise).toBeGreaterThan(0);
  });

  // Scenario 10: Provider views earnings and commission deduction
  it('Scenario 10: Provider views earnings and commission deduction in console', async () => {
    const consoleRes = await request(app)
      .get('/api/services/provider/console')
      .set('Authorization', `Bearer ${salonProviderToken}`);

    expect(consoleRes.status).toBe(200);
    expect(consoleRes.body.provider).toBeDefined();
    expect(consoleRes.body.metrics).toBeDefined();
    expect(consoleRes.body.metrics.totalBookings).toBeGreaterThan(0);
    expect(consoleRes.body.provider.earnings.length).toBeGreaterThan(0);

    const firstEarning = consoleRes.body.provider.earnings[0];
    expect(firstEarning.amountPaise).toBeGreaterThan(0);
    expect(firstEarning.commissionPaise).toBeGreaterThan(0);
    expect(firstEarning.netEarningPaise).toBe(firstEarning.amountPaise - firstEarning.commissionPaise);
  });
});
