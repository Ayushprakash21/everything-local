import express, { Response } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const riderRouter = express.Router();

/**
 * 1. Rider Onboarding & Registration
 */
riderRouter.post('/onboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId || req.user!.id!;
    const {
      vehicleType,
      vehicleNumber,
      drivingLicenceNumber,
      panNumber,
      bankAccountNumber,
      bankIfsc,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    if (!vehicleNumber || !drivingLicenceNumber) {
      res.status(400).json({ error: 'Vehicle number and driving licence number are mandatory' });
      return;
    }

    const riderCode = `EL-RIDER-IND-${Math.floor(100 + Math.random() * 900)}`;

    const rider = await prisma.riderProfile.upsert({
      where: { userId },
      update: {
        vehicleType: vehicleType || 'MOTORCYCLE',
        vehicleNumber,
        drivingLicenceNumber,
        panNumber,
        bankAccountNumber,
        bankIfsc,
        emergencyContactName,
        emergencyContactPhone,
        isVerified: true,
        isActive: true
      },
      create: {
        userId,
        riderCode,
        vehicleType: vehicleType || 'MOTORCYCLE',
        vehicleNumber,
        drivingLicenceNumber,
        panNumber,
        bankAccountNumber,
        bankIfsc,
        emergencyContactName,
        emergencyContactPhone,
        isVerified: true,
        isActive: true,
        isOnline: true,
        rating: 5.0,
        totalDeliveries: 0
      }
    });

    // Update user role to RIDER
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'RIDER' }
    });

    res.status(201).json({ success: true, rider });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Get Rider Profile
 */
riderRouter.get('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.userId || req.user!.id! },
      include: {
        earnings: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    res.json({ rider });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Toggle Online/Offline Status
 */
riderRouter.post('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { isOnline } = req.body;
    const rider = await prisma.riderProfile.update({
      where: { userId: req.user!.userId || req.user!.id! },
      data: { isOnline: Boolean(isOnline) }
    });

    res.json({ success: true, isOnline: rider.isOnline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. List Available Nearby Tasks
 */
riderRouter.get('/tasks/available', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.deliveryTask.findMany({
      where: {
        status: 'AVAILABLE'
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Get Active Task
 */
riderRouter.get('/tasks/active', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.userId || req.user!.id! }
    });

    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const activeTask = await prisma.deliveryTask.findFirst({
      where: {
        riderId: rider.id,
        status: { in: ['ACCEPTED', 'AT_STORE', 'PICKED_UP', 'EN_ROUTE'] }
      },
      include: {
        merchantOrder: {
          include: { items: true }
        }
      }
    });

    res.json({ activeTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Accept Task
 */
riderRouter.post('/tasks/:id/accept', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.userId || req.user!.id! }
    });

    if (!rider || !rider.isActive) {
      res.status(403).json({ error: 'Rider is not verified or active' });
      return;
    }

    const taskId = req.params.id;
    const task = await prisma.deliveryTask.findUnique({ where: { id: taskId } });

    if (!task) {
      res.status(404).json({ error: 'Delivery task not found' });
      return;
    }

    if (task.status !== 'AVAILABLE') {
      res.status(400).json({ error: 'Task is no longer available for acceptance' });
      return;
    }

    const updatedTask = await prisma.deliveryTask.update({
      where: { id: taskId },
      data: {
        riderId: rider.id,
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    res.json({ success: true, task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. Mark Arrived At Store
 */
riderRouter.post('/tasks/:id/at-store', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const task = await prisma.deliveryTask.update({
      where: { id: taskId },
      data: {
        status: 'AT_STORE',
        atStoreAt: new Date()
      }
    });

    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 8. Merchant Handover via Pickup OTP
 */
riderRouter.post('/tasks/:id/pickup', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const pickupOtp = req.body.pickupOtp || req.body.otp;

    const task = await prisma.deliveryTask.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: 'Delivery task not found' });
      return;
    }

    if (!pickupOtp || task.pickupOtp !== String(pickupOtp).trim()) {
      res.status(400).json({ error: 'Invalid merchant pickup OTP. Please verify with merchant.' });
      return;
    }

    const updatedTask = await prisma.deliveryTask.update({
      where: { id: taskId },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date()
      }
    });

    // Update child order status if present
    if (task.merchantOrderId) {
      await prisma.merchantChildOrder.update({
        where: { id: task.merchantOrderId },
        data: { status: 'PICKED_UP' }
      });
    }

    res.json({ success: true, task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 9. Customer Handover via Delivery OTP
 */
riderRouter.post('/tasks/:id/deliver', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const deliveryOtp = req.body.deliveryOtp || req.body.otp;

    const task = await prisma.deliveryTask.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: 'Delivery task not found' });
      return;
    }

    if (!deliveryOtp || task.deliveryOtp !== String(deliveryOtp).trim()) {
      res.status(400).json({ error: 'Invalid customer delivery OTP. Please verify with recipient.' });
      return;
    }

    // Atomic delivery completion and earnings crediting
    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryTask.update({
        where: { id: taskId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date()
        }
      });

      // Update child order
      if (task.merchantOrderId) {
        await tx.merchantChildOrder.update({
          where: { id: task.merchantOrderId },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date()
          }
        });
      }

      // Increment rider delivery count
      if (task.riderId) {
        await tx.riderProfile.update({
          where: { id: task.riderId },
          data: { totalDeliveries: { increment: 1 } }
        });

        // Record Base Earning Ledger Entry
        await tx.riderEarningLedger.create({
          data: {
            riderId: task.riderId,
            deliveryTaskId: task.id,
            type: 'BASE_PAYOUT',
            amountPaise: task.riderBasePayoutPaise,
            description: `Base delivery fee for ${task.taskNumber}`,
            settlementStatus: 'UNSETTLED'
          }
        });

        // Additional Pickup payout if any
        if (task.additionalPickupPayoutPaise > 0) {
          await tx.riderEarningLedger.create({
            data: {
              riderId: task.riderId,
              deliveryTaskId: task.id,
              type: 'ADDITIONAL_PICKUP',
              amountPaise: task.additionalPickupPayoutPaise,
              description: `Multi-store pickup incentive for ${task.taskNumber}`,
              settlementStatus: 'UNSETTLED'
            }
          });
        }

        // Surge payout if any
        if (task.surgePayoutPaise > 0) {
          await tx.riderEarningLedger.create({
            data: {
              riderId: task.riderId,
              deliveryTaskId: task.id,
              type: 'PEAK_INCENTIVE',
              amountPaise: task.surgePayoutPaise,
              description: `Rush hour surge payout for ${task.taskNumber}`,
              settlementStatus: 'UNSETTLED'
            }
          });
        }
      }

      return updated;
    });

    res.json({ success: true, task: completed, payoutPaise: completed.totalPayoutPaise });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 10. Rider Earnings Dashboard
 */
riderRouter.get('/earnings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.userId || req.user!.id! }
    });

    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const earnings = await prisma.riderEarningLedger.findMany({
      where: { riderId: rider.id },
      orderBy: { createdAt: 'desc' }
    });

    let totalEarningsPaise = 0;
    let unsettledEarningsPaise = 0;
    for (const e of earnings) {
      totalEarningsPaise += e.amountPaise;
      if (e.settlementStatus === 'UNSETTLED') {
        unsettledEarningsPaise += e.amountPaise;
      }
    }

    res.json({
      riderCode: rider.riderCode,
      rating: rider.rating,
      totalDeliveries: rider.totalDeliveries,
      totalEarningsPaise,
      unsettledEarningsPaise,
      earnings
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
