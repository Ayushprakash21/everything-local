import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { DeliveryDispatchEngine } from '../core/deliveryDispatchEngine';

const router = Router();

// Protect all delivery operations routes with ADMIN role requirement
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// -------------------------------------------------------------
// 1. OVERVIEW DASHBOARD
// -------------------------------------------------------------
router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalPartners, onlinePartners, activeTasks, unassignedTasks, todayDelivered, totalIncidents] =
      await Promise.all([
        prisma.riderProfile.count(),
        prisma.riderProfile.count({ where: { isOnline: true } }),
        prisma.deliveryTask.count({
          where: { status: { in: ['ACCEPTED', 'AT_STORE', 'PICKED_UP', 'EN_ROUTE'] } }
        }),
        prisma.deliveryTask.count({
          where: { status: { in: ['AVAILABLE', 'OFFERED'] } }
        }),
        prisma.deliveryTask.count({
          where: {
            status: 'DELIVERED',
            deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.deliveryIncident.count({ where: { status: 'OPEN' } })
      ]);

    res.json({
      metrics: {
        totalPartners,
        onlinePartners,
        activeTasks,
        unassignedTasks,
        todayDelivered,
        openIncidents: totalIncidents
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 2. DELIVERY PARTNERS ROSTER
// -------------------------------------------------------------
router.get('/partners', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, isOnline, search } = req.query;

    const where: any = {};
    if (status) where.approvalStatus = status as string;
    if (isOnline !== undefined) where.isOnline = isOnline === 'true';
    if (search) {
      where.OR = [
        { riderCode: { contains: search as string } },
        { user: { name: { contains: search as string } } },
        { user: { phone: { contains: search as string } } }
      ];
    }

    const partners = await prisma.riderProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        vehicles: true,
        documents: true,
        tasks: {
          where: { status: { in: ['ACCEPTED', 'AT_STORE', 'PICKED_UP', 'EN_ROUTE'] } },
          select: { id: true, taskNumber: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ partners });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Suspend or Reactivate Partner
 */
router.post('/partners/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { approvalStatus, isActive } = req.body;
    const partner = await prisma.riderProfile.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: approvalStatus || undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        isOnline: approvalStatus === 'SUSPENDED' ? false : undefined
      }
    });

    res.json({ success: true, partner });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 3. PARTNER APPLICATIONS QUEUE
// -------------------------------------------------------------
router.get('/applications', async (_req: Request, res: Response): Promise<void> => {
  try {
    const applications = await prisma.riderProfile.findMany({
      where: {
        approvalStatus: { in: ['APPLIED', 'UNDER_REVIEW'] }
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        documents: true,
        vehicles: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ applications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve or Reject Partner Application
 */
router.post('/applications/:id/decision', async (req: Request, res: Response): Promise<void> => {
  try {
    const { decision, reason } = req.body; // APPROVED or REJECTED
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      res.status(400).json({ error: 'Decision must be APPROVED or REJECTED' });
      return;
    }

    const partner = await prisma.riderProfile.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: decision,
        isVerified: decision === 'APPROVED',
        isActive: decision === 'APPROVED'
      }
    });

    res.json({ success: true, partner, decision, reason });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 4. DOCUMENT VERIFICATION
// -------------------------------------------------------------
router.post('/documents/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, rejectionReason } = req.body; // APPROVED or REJECTED
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
      return;
    }

    const doc = await prisma.deliveryPartnerDocument.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: status,
        verifiedByAdminId: req.user!.userId,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
      }
    });

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 5. LIVE DELIVERY OPERATIONS
// -------------------------------------------------------------
router.get('/live', async (_req: Request, res: Response): Promise<void> => {
  try {
    const activeTasks = await prisma.deliveryTask.findMany({
      where: {
        status: { in: ['OFFERED', 'ACCEPTED', 'AT_STORE', 'PICKED_UP', 'EN_ROUTE'] }
      },
      include: {
        rider: {
          include: { user: { select: { name: true, phone: true } } }
        },
        locations: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const onlinePartners = await prisma.riderProfile.findMany({
      where: { isOnline: true },
      include: {
        user: { select: { name: true, phone: true } }
      }
    });

    res.json({ activeTasks, onlinePartners });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 6. DELIVERY ASSIGNMENTS (MANUAL DISPATCH & OVERRIDE)
// -------------------------------------------------------------
router.post('/assignments/manual-assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, partnerId } = req.body;
    if (!taskId || !partnerId) {
      res.status(400).json({ error: 'taskId and partnerId are required' });
      return;
    }

    const result = await DeliveryDispatchEngine.offerTaskToPartner(taskId, partnerId, 120); // 2-min window for manual
    res.json({ success: true, message: 'Task assigned manually to partner', result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 7. DELIVERY HISTORY
// -------------------------------------------------------------
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (status) where.status = status as string;

    const [tasks, total] = await Promise.all([
      prisma.deliveryTask.findMany({
        where,
        include: {
          rider: { include: { user: { select: { name: true, phone: true } } } },
          proofs: true,
          statusHistories: { orderBy: { timestamp: 'asc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.deliveryTask.count({ where })
    ]);

    res.json({ tasks, total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 8. EARNINGS & SETTLEMENTS
// -------------------------------------------------------------
router.get('/settlements', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [settlements, unsettledRiders] = await Promise.all([
      prisma.riderSettlement.findMany({
        include: {
          rider: { include: { user: { select: { name: true, phone: true } } } },
          entries: true
        },
        orderBy: { processedAt: 'desc' },
        take: 30
      }),
      prisma.riderEarningLedger.groupBy({
        by: ['riderId'],
        where: { settlementStatus: 'UNSETTLED' },
        _sum: { amountPaise: true },
        _count: { id: true }
      })
    ]);

    res.json({ settlements, unsettledRiders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process Batch Settlement Payout
 */
router.post('/settlements/payout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { riderId, payoutReference, deductionsPaise = 0 } = req.body;
    if (!riderId) {
      res.status(400).json({ error: 'riderId is required' });
      return;
    }

    const unsettledEntries = await prisma.riderEarningLedger.findMany({
      where: { riderId, settlementStatus: 'UNSETTLED' }
    });

    if (unsettledEntries.length === 0) {
      res.status(400).json({ error: 'No unsettled earnings found for this partner' });
      return;
    }

    const totalEarningsPaise = unsettledEntries.reduce((sum, e) => sum + e.amountPaise, 0);
    const netPayoutPaise = totalEarningsPaise - deductionsPaise;

    const settlement = await prisma.$transaction(async (tx) => {
      const s = await tx.riderSettlement.create({
        data: {
          riderId,
          periodStart: unsettledEntries[unsettledEntries.length - 1].createdAt,
          periodEnd: new Date(),
          totalEarningsPaise,
          deductionsPaise,
          netPayoutPaise,
          payoutReference: payoutReference || `EL-PAYOUT-${Date.now()}`,
          status: 'COMPLETED'
        }
      });

      // Mark all entries settled
      await tx.riderEarningLedger.updateMany({
        where: { id: { in: unsettledEntries.map((e) => e.id) } },
        data: {
          settlementStatus: 'SETTLED',
          settlementId: s.id
        }
      });

      return s;
    });

    res.json({ success: true, settlement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 9. DELIVERY PERFORMANCE & SLA
// -------------------------------------------------------------
router.get('/performance', async (_req: Request, res: Response): Promise<void> => {
  try {
    const completedTasks = await prisma.deliveryTask.findMany({
      where: { status: 'DELIVERED', deliveredAt: { not: null }, acceptedAt: { not: null } },
      select: {
        id: true,
        acceptedAt: true,
        atStoreAt: true,
        pickedUpAt: true,
        deliveredAt: true,
        estimatedMinutes: true
      },
      take: 100,
      orderBy: { deliveredAt: 'desc' }
    });

    let totalTransitMinutes = 0;
    let onTimeCount = 0;

    for (const t of completedTasks) {
      const transitMin = (t.deliveredAt!.getTime() - t.acceptedAt!.getTime()) / (1000 * 60);
      totalTransitMinutes += transitMin;
      if (transitMin <= t.estimatedMinutes) {
        onTimeCount++;
      }
    }

    const avgMinutes = completedTasks.length > 0 ? (totalTransitMinutes / completedTasks.length).toFixed(1) : '0';
    const onTimePct = completedTasks.length > 0 ? ((onTimeCount / completedTasks.length) * 100).toFixed(1) : '100';

    res.json({
      metrics: {
        totalAnalyzed: completedTasks.length,
        avgDeliveryMinutes: avgMinutes,
        onTimeRatePct: onTimePct
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 10. INCIDENTS AND SUPPORT
// -------------------------------------------------------------
router.get('/incidents', async (_req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await prisma.deliveryIncident.findMany({
      include: {
        partner: { include: { user: { select: { name: true, phone: true } } } },
        task: true
      },
      orderBy: { reportedAt: 'desc' }
    });

    res.json({ incidents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Resolve Incident Ticket
 */
router.post('/incidents/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resolutionNotes, adminAction } = req.body;
    const incident = await prisma.deliveryIncident.update({
      where: { id: req.params.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || 'Resolved by administrator',
        adminAction: adminAction || 'NONE'
      }
    });

    res.json({ success: true, incident });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 11. DELIVERY CONFIGURATION
// -------------------------------------------------------------
router.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rules = await prisma.deliveryPricingRule.findMany({
      orderBy: { targetMinutes: 'asc' }
    });

    res.json({ rules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update Delivery Pricing Tier Rule
 */
router.put('/config/rules/:tierCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { baseDeliveryPaise, perKmPaise, prioritySurchargePaise, maxRoadDistanceKm, peakMultiplier } = req.body;
    const rule = await prisma.deliveryPricingRule.update({
      where: { tierCode: req.params.tierCode },
      data: {
        baseDeliveryPaise,
        perKmPaise,
        prioritySurchargePaise,
        maxRoadDistanceKm,
        peakMultiplier
      }
    });

    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
