import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';
import { GeospatialEngine } from '../core/geospatial';

const router = Router();

// ==========================================
// 1. PUBLIC DISCOVERY ENDPOINTS
// ==========================================

// 1.1 List All Active Service Categories
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { services: { where: { isActive: true } } }
        }
      }
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// 1.2 Search & Discover Service Providers (with location & coverage filtering)
router.get('/providers', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    const categorySlug = req.query.category as string | undefined;
    const fulfillmentType = req.query.fulfillment as string | undefined; // 'ALL', 'SHOP_VISIT', 'HOME_VISIT'
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    const hasCoords = !isNaN(lat) && !isNaN(lng);
    const customerCoord = hasCoords ? { latitude: lat, longitude: lng } : null;

    const whereClause: any = {
      isOpen: true,
      verificationStatus: 'VERIFIED'
    };

    if (categorySlug && categorySlug !== 'all') {
      whereClause.categorySlug = categorySlug;
    }

    if (fulfillmentType === 'SHOP_VISIT') {
      whereClause.hasShopVisit = true;
    } else if (fulfillmentType === 'HOME_VISIT') {
      whereClause.hasHomeVisit = true;
    }

    const providers = await prisma.serviceProvider.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
          take: 6
        },
        staff: {
          where: { isActive: true }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    // Evaluate distance and serviceability for each provider
    const evaluated = providers.map((provider) => {
      let distanceKm: number | undefined = undefined;
      let isHomeVisitServiceable = provider.hasHomeVisit;
      let isShopVisitServiceable = provider.hasShopVisit;

      if (customerCoord && provider.shopLatitude && provider.shopLongitude) {
        distanceKm = GeospatialEngine.calculateDistanceKm(
          { latitude: provider.shopLatitude, longitude: provider.shopLongitude },
          customerCoord
        );

        if (provider.hasHomeVisit) {
          isHomeVisitServiceable = distanceKm <= provider.homeVisitRadiusKm;
        }
      }

      // Filter by text search if provided
      const matchesQuery = !q ||
        provider.businessName.toLowerCase().includes(q) ||
        provider.description?.toLowerCase().includes(q) ||
        provider.services.some((s) => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));

      return {
        id: provider.id,
        businessName: provider.businessName,
        slug: provider.slug,
        description: provider.description,
        profileImageUrl: provider.profileImageUrl,
        categorySlug: provider.categorySlug,
        rating: provider.rating,
        reviewCount: provider.reviewCount || provider.reviews.length,
        hasShopVisit: provider.hasShopVisit,
        shopAddressLine: provider.shopAddressLine,
        shopCity: provider.shopCity,
        shopPincode: provider.shopPincode,
        hasHomeVisit: provider.hasHomeVisit,
        homeVisitRadiusKm: provider.homeVisitRadiusKm,
        homeVisitFeePaise: provider.homeVisitFeePaise,
        distanceKm,
        isHomeVisitServiceable,
        isShopVisitServiceable,
        servicesCount: provider.services.length,
        featuredServices: provider.services,
        matchesQuery
      };
    });

    const filtered = evaluated.filter((p) => p.matchesQuery);

    // Sort by distance if coords provided, else by rating
    if (hasCoords) {
      filtered.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
    } else {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    res.json({
      total: filtered.length,
      providers: filtered
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to discover service providers' });
  }
});

// 1.3 Get Full Provider Profile & Catalogue
router.get('/providers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      include: {
        services: {
          where: { isActive: true },
          include: { category: true }
        },
        staff: {
          where: { isActive: true }
        },
        reviews: {
          include: {
            customer: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!provider) {
      res.status(404).json({ error: 'Service provider not found' });
      return;
    }

    let distanceKm: number | undefined = undefined;
    let isHomeVisitServiceable = provider.hasHomeVisit;

    if (!isNaN(lat) && !isNaN(lng) && provider.shopLatitude && provider.shopLongitude) {
      distanceKm = GeospatialEngine.calculateDistanceKm(
        { latitude: provider.shopLatitude, longitude: provider.shopLongitude },
        { latitude: lat, longitude: lng }
      );
      isHomeVisitServiceable = distanceKm <= provider.homeVisitRadiusKm;
    }

    res.json({
      provider: {
        ...provider,
        distanceKm,
        isHomeVisitServiceable
      }
    });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    res.status(500).json({ error: 'Failed to fetch provider profile' });
  }
});

// 1.4 Get Available Appointment Slots for a Provider on a Given Date
router.get('/slots', async (req: Request, res: Response): Promise<void> => {
  try {
    const providerId = req.query.providerId as string;
    const date = req.query.date as string; // YYYY-MM-DD

    if (!providerId || !date) {
      res.status(400).json({ error: 'providerId and date (YYYY-MM-DD) are required' });
      return;
    }

    // Standard business operating slots: 09:00 AM to 07:00 PM (10 slots)
    const standardSlots = [
      '09:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '01:00 PM',
      '02:30 PM',
      '03:30 PM',
      '04:30 PM',
      '05:30 PM',
      '06:30 PM'
    ];

    // Check active booked bookings for this provider on this date
    const bookedBookings = await prisma.serviceBooking.findMany({
      where: {
        providerId,
        bookingDate: date,
        status: {
          notIn: ['CANCELLED', 'REJECTED']
        }
      },
      select: { timeSlot: true }
    });

    const bookedSlotSet = new Set(bookedBookings.map((b) => b.timeSlot));

    const slots = standardSlots.map((timeSlot) => ({
      timeSlot,
      date,
      isAvailable: !bookedSlotSet.has(timeSlot)
    }));

    res.json({ date, slots });
  } catch (error) {
    console.error('Error fetching appointment slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// ==========================================
// 2. CUSTOMER BOOKING WORKFLOWS
// ==========================================

const createBookingSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  fulfillmentType: z.enum(['SHOP_VISIT', 'HOME_VISIT']),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  timeSlot: z.string(),
  customerAddressLine: z.string().optional(),
  customerLocality: z.string().optional(),
  customerCity: z.string().default('Indore'),
  customerPincode: z.string().optional(),
  customerLat: z.number().optional(),
  customerLng: z.number().optional(),
  instructions: z.string().optional(),
  staffId: z.string().optional()
});

// 2.1 Book a Service Appointment (Transaction-Safe Concurrency & Slot Collision Prevention)
router.post('/bookings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = createBookingSchema.parse(req.body);

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: body.providerId }
    });
    if (!provider || !provider.isOpen || provider.verificationStatus !== 'VERIFIED') {
      res.status(400).json({ error: 'Provider is currently not accepting bookings' });
      return;
    }

    const service = await prisma.serviceListing.findFirst({
      where: { id: body.serviceId, providerId: body.providerId, isActive: true }
    });
    if (!service) {
      res.status(404).json({ error: 'Service listing not found or inactive' });
      return;
    }

    // Validate fulfillment permissions
    if (body.fulfillmentType === 'SHOP_VISIT' && !service.allowsShopVisit) {
      res.status(400).json({ error: 'This service does not support shop visits' });
      return;
    }
    if (body.fulfillmentType === 'HOME_VISIT') {
      if (!service.allowsHomeVisit || !provider.hasHomeVisit) {
        res.status(400).json({ error: 'This service does not support home visits' });
        return;
      }
      // Check location serviceability for Home Visit
      if (body.customerLat !== undefined && body.customerLng !== undefined && provider.shopLatitude && provider.shopLongitude) {
        const distanceKm = GeospatialEngine.calculateDistanceKm(
          { latitude: provider.shopLatitude, longitude: provider.shopLongitude },
          { latitude: body.customerLat, longitude: body.customerLng }
        );
        if (distanceKm > provider.homeVisitRadiusKm) {
          res.status(400).json({
            error: `Your address is ${distanceKm.toFixed(1)} km away, which exceeds the provider's home visit radius of ${provider.homeVisitRadiusKm} km.`
          });
          return;
        }
      }
    }

    // Financial calculations in Integer Paise
    const serviceFeePaise = service.pricePaise;
    const travelFeePaise = body.fulfillmentType === 'HOME_VISIT' ? provider.homeVisitFeePaise : 0;
    const totalAmountPaise = serviceFeePaise + travelFeePaise;

    // Platform commission
    const commissionPaise = Math.round((totalAmountPaise * provider.commissionRatePct) / 100);
    const providerPayablePaise = totalAmountPaise - commissionPaise;
    const platformRevenuePaise = commissionPaise;

    const bookingNumber = `BKG-IND-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Transaction-Safe Execution to prevent double-booking collisions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Double-booking check: Ensure no active booking exists for provider at this date and timeSlot
      const existing = await tx.serviceBooking.findFirst({
        where: {
          providerId: body.providerId,
          bookingDate: body.bookingDate,
          timeSlot: body.timeSlot,
          status: {
            notIn: ['CANCELLED', 'REJECTED']
          }
        }
      });

      if (existing) {
        throw new Error('This appointment slot has just been reserved by another customer. Please choose another time slot.');
      }

      // 2. Create the Booking
      const newBooking = await tx.serviceBooking.create({
        data: {
          bookingNumber,
          customerId: userId,
          providerId: body.providerId,
          serviceId: body.serviceId,
          staffId: body.staffId,
          fulfillmentType: body.fulfillmentType,
          bookingDate: body.bookingDate,
          timeSlot: body.timeSlot,
          status: 'CONFIRMED', // Instant confirmation for pilot
          customerAddressLine: body.customerAddressLine,
          customerLocality: body.customerLocality,
          customerCity: body.customerCity,
          customerPincode: body.customerPincode,
          customerLat: body.customerLat,
          customerLng: body.customerLng,
          instructions: body.instructions,
          serviceFeePaise,
          travelFeePaise,
          totalAmountPaise,
          commissionPaise,
          providerPayablePaise,
          platformRevenuePaise,
          paymentStatus: 'PENDING'
        },
        include: {
          provider: true,
          service: true,
          staff: true
        }
      });

      // 3. Record Initial Booking Event
      await tx.bookingStatusEvent.create({
        data: {
          bookingId: newBooking.id,
          status: 'CONFIRMED',
          actorId: userId,
          actorRole: 'CUSTOMER',
          note: `Appointment confirmed for ${body.bookingDate} at ${body.timeSlot} (${body.fulfillmentType.replace(/_/g, ' ')})`
        }
      });

      // 4. Record Provider Earnings (Pending payout on service completion)
      await tx.providerEarning.create({
        data: {
          providerId: body.providerId,
          bookingId: newBooking.id,
          amountPaise: totalAmountPaise,
          commissionPaise,
          netEarningPaise: providerPayablePaise,
          payoutStatus: 'PENDING',
          reference: bookingNumber
        }
      });

      return newBooking;
    });

    res.status(201).json({
      message: 'Service appointment successfully booked',
      booking: result
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    res.status(400).json({ error: error.message || 'Failed to create booking' });
  }
});

// 2.2 List Customer Bookings History
router.get('/bookings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      where: { customerId: req.user!.userId },
      include: {
        provider: true,
        service: true,
        staff: true,
        review: true,
        events: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch customer bookings' });
  }
});

// 2.3 Cancel a Booking
router.post('/bookings/:id/cancel', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;

    const booking = await prisma.serviceBooking.findFirst({
      where: { id, customerId: userId }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
      res.status(400).json({ error: `Cannot cancel booking in status: ${booking.status}` });
      return;
    }

    const [updatedBooking] = await prisma.$transaction([
      prisma.serviceBooking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason || 'Cancelled by customer'
        }
      }),
      prisma.bookingStatusEvent.create({
        data: {
          bookingId: id,
          status: 'CANCELLED',
          actorId: userId,
          actorRole: 'CUSTOMER',
          note: reason || 'Cancelled by customer'
        }
      })
    ]);

    res.json({ message: 'Booking successfully cancelled', booking: updatedBooking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// 2.4 Reschedule a Booking (Atomic Slot Update)
router.post('/bookings/:id/reschedule', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const targetDate = req.body.bookingDate || req.body.newDate;
    const targetSlot = req.body.timeSlot || req.body.newTimeSlot;
    const userId = req.user!.userId;

    if (!targetDate || !targetSlot) {
      res.status(400).json({ error: 'bookingDate (or newDate) and timeSlot (or newTimeSlot) are required' });
      return;
    }

    const booking = await prisma.serviceBooking.findFirst({
      where: { id, customerId: userId }
    });

    if (!booking || ['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      res.status(400).json({ error: 'Cannot reschedule this booking' });
      return;
    }

    // Check slot collision
    const existing = await prisma.serviceBooking.findFirst({
      where: {
        providerId: booking.providerId,
        bookingDate: targetDate,
        timeSlot: targetSlot,
        id: { not: id },
        status: { notIn: ['CANCELLED', 'REJECTED'] }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'The requested slot is already booked. Please choose another slot.' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.serviceBooking.update({
        where: { id },
        data: {
          bookingDate: targetDate,
          timeSlot: targetSlot
        }
      });

      await tx.bookingStatusEvent.create({
        data: {
          bookingId: id,
          status: b.status,
          actorId: userId,
          actorRole: 'CUSTOMER',
          note: `Rescheduled to ${targetDate} at ${targetSlot}`
        }
      });

      return b;
    });

    res.json({ message: 'Booking successfully rescheduled', booking: updated });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

// 2.5 Submit Service Review & Rating
router.post('/bookings/:id/review', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.userId;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Valid rating between 1 and 5 required' });
      return;
    }

    const booking = await prisma.serviceBooking.findFirst({
      where: { id, customerId: userId }
    });

    if (!booking || booking.status !== 'COMPLETED') {
      res.status(400).json({ error: 'Reviews can only be submitted for completed services' });
      return;
    }

    const review = await prisma.serviceReview.create({
      data: {
        bookingId: id,
        providerId: booking.providerId,
        customerId: userId,
        rating: Math.round(rating),
        comment: comment?.trim()
      }
    });

    // Update Provider Average Rating
    const allReviews = await prisma.serviceReview.findMany({
      where: { providerId: booking.providerId },
      select: { rating: true }
    });

    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await prisma.serviceProvider.update({
      where: { id: booking.providerId },
      data: {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allReviews.length
      }
    });

    res.status(201).json({ message: 'Review recorded', review });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(400).json({ error: error.message || 'Failed to submit review' });
  }
});

// ==========================================
// 3. SERVICE PROVIDER CONSOLE ENDPOINTS
// ==========================================

// 3.1 Provider Console Profile
router.get('/provider/console', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findFirst({
      where: { ownerId: userId },
      include: {
        services: true,
        staff: true,
        bookings: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            service: true,
            staff: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        earnings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!provider) {
      res.status(404).json({ error: 'No service provider profile registered for this account' });
      return;
    }

    // Compute metrics
    const completedBookings = provider.bookings.filter((b) => b.status === 'COMPLETED');
    const totalRevenuePaise = completedBookings.reduce((sum, b) => sum + b.totalAmountPaise, 0);
    const totalNetEarningsPaise = completedBookings.reduce((sum, b) => sum + b.providerPayablePaise, 0);
    const pendingBookingsCount = provider.bookings.filter((b) => ['PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length;

    res.json({
      provider,
      metrics: {
        totalBookings: provider.bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookingsCount,
        totalRevenuePaise,
        totalNetEarningsPaise
      }
    });
  } catch (error) {
    console.error('Provider console error:', error);
    res.status(500).json({ error: 'Failed to fetch provider console data' });
  }
});

// 3.2 Update Booking Status from Provider Console
router.post('/provider/bookings/:id/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, staffId } = req.body;
    const userId = req.user!.userId;

    const provider = await prisma.serviceProvider.findFirst({
      where: { ownerId: userId }
    });

    if (!provider) {
      res.status(403).json({ error: 'Unauthorized: Only registered providers can update bookings' });
      return;
    }

    const booking = await prisma.serviceBooking.findFirst({
      where: { id, providerId: provider.id }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.serviceBooking.update({
        where: { id },
        data: {
          status,
          staffId: staffId !== undefined ? staffId : booking.staffId
        }
      });

      await tx.bookingStatusEvent.create({
        data: {
          bookingId: id,
          status,
          actorId: userId,
          actorRole: 'PROVIDER',
          note: note || `Status updated to ${status.replace(/_/g, ' ')}`
        }
      });

      // If completed, update earning payout status
      if (status === 'COMPLETED') {
        await tx.providerEarning.updateMany({
          where: { bookingId: id },
          data: { payoutStatus: 'PROCESSED' }
        });
      }

      return b;
    });

    res.json({ message: 'Booking status updated successfully', booking: updated });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// 3.3 Add / Edit Service Listing
router.post('/provider/services', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findFirst({
      where: { ownerId: userId }
    });

    if (!provider) {
      res.status(403).json({ error: 'Provider profile required' });
      return;
    }

    const { title, categoryId, description, pricePaise, mrpPaise, durationMinutes, allowsShopVisit, allowsHomeVisit } = req.body;

    const service = await prisma.serviceListing.create({
      data: {
        providerId: provider.id,
        categoryId,
        title,
        description,
        pricePaise: parseInt(pricePaise, 10),
        mrpPaise: mrpPaise ? parseInt(mrpPaise, 10) : null,
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        allowsShopVisit: allowsShopVisit !== false,
        allowsHomeVisit: allowsHomeVisit !== false
      }
    });

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error: any) {
    console.error('Error creating service:', error);
    res.status(400).json({ error: error.message || 'Failed to create service' });
  }
});

// ==========================================
// 4. ADMIN CONSOLE ENDPOINTS
// ==========================================

// 4.1 Admin: List All Providers with Moderation
router.get('/admin/providers', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin permission required' });
      return;
    }

    const providers = await prisma.serviceProvider.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: {
          select: { services: true, bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ providers });
  } catch (error) {
    console.error('Admin providers error:', error);
    res.status(500).json({ error: 'Failed to load providers' });
  }
});

// 4.2 Admin: Approve / Reject Provider Verification
router.post('/admin/providers/:id/verify', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin permission required' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body; // 'VERIFIED' | 'REJECTED' | 'SUSPENDED'

    const updated = await prisma.serviceProvider.update({
      where: { id },
      data: {
        verificationStatus: status,
        isVerified: status === 'VERIFIED'
      }
    });

    res.json({ message: `Provider status updated to ${status}`, provider: updated });
  } catch (error) {
    console.error('Admin verify error:', error);
    res.status(500).json({ error: 'Failed to update provider status' });
  }
});

// 4.3 Admin: Marketplace Service Bookings Monitor
router.get('/admin/bookings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin permission required' });
      return;
    }

    const bookings = await prisma.serviceBooking.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        provider: { select: { id: true, businessName: true, contactPhone: true } },
        service: { select: { id: true, title: true, pricePaise: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Summary Statistics
    const totalGmvPaise = bookings.reduce((sum, b) => sum + b.totalAmountPaise, 0);
    const totalPlatformRevenuePaise = bookings.reduce((sum, b) => sum + b.platformRevenuePaise, 0);

    res.json({
      bookings,
      stats: {
        totalBookings: bookings.length,
        totalGmvPaise,
        totalPlatformRevenuePaise
      }
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

export default router;
