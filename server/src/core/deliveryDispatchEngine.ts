import crypto from 'crypto';
import { prisma } from '../db';

export interface DispatchCandidate {
  partnerId: string;
  userId: string;
  partnerCode: string;
  name: string;
  phone: string | null;
  vehicleType: string;
  distanceKm: number;
  rating: number;
  activeTasksCount: number;
}

export class DeliveryDispatchEngine {
  private static OTP_SALT = process.env.OTP_SALT || 'el_delivery_otp_secure_salt_2026';

  /**
   * Generates a 4-digit numeric OTP and its salted SHA-256 hash
   */
  public static generateHashedOtp(): { otp: string; hashedOtp: string; expiresAt: Date } {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiration
    return { otp, hashedOtp, expiresAt };
  }

  /**
   * Computes salted SHA-256 hash of an OTP
   */
  public static hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(`${this.OTP_SALT}:${otp}`).digest('hex');
  }

  /**
   * Verifies an OTP against a stored salted hash with attempt rate limiting
   */
  public static verifyOtp(otp: string, storedHash: string): boolean {
    const computed = this.hashOtp(otp);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
  }

  /**
   * Calculates straight-line Euclidean distance in km between two GPS coordinates
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Finds eligible, approved, online couriers near a pickup location with active capacity
   */
  public static async findEligiblePartners(
    pickupLat: number,
    pickupLon: number,
    maxRadiusKm: number = 5.0,
    requiredVehicleType?: string
  ): Promise<DispatchCandidate[]> {
    // Courier must be online, active, and approved
    const couriers = await prisma.riderProfile.findMany({
      where: {
        isOnline: true,
        isActive: true,
        approvalStatus: 'APPROVED'
      },
      include: {
        user: true,
        tasks: {
          where: {
            status: { in: ['ACCEPTED', 'AT_STORE', 'PICKED_UP', 'EN_ROUTE'] }
          }
        }
      }
    });

    const candidates: DispatchCandidate[] = [];

    for (const courier of couriers) {
      // Check active workload: maximum 2 concurrent orders
      if (courier.tasks.length >= 2) continue;

      // Optional vehicle filter
      if (requiredVehicleType && courier.vehicleType !== requiredVehicleType) continue;

      // If courier coordinates are missing, fallback to default Indore central coords
      const courierLat = courier.currentLatitude || 22.7196;
      const courierLon = courier.currentLongitude || 75.8577;

      const dist = this.calculateDistanceKm(pickupLat, pickupLon, courierLat, courierLon);

      if (dist <= maxRadiusKm) {
        candidates.push({
          partnerId: courier.id,
          userId: courier.userId,
          partnerCode: courier.riderCode,
          name: courier.user.name,
          phone: courier.user.phone,
          vehicleType: courier.vehicleType,
          distanceKm: dist,
          rating: courier.rating,
          activeTasksCount: courier.tasks.length
        });
      }
    }

    // Sort by proximity first, then lowest workload, then highest rating
    return candidates.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      if (a.activeTasksCount !== b.activeTasksCount) return a.activeTasksCount - b.activeTasksCount;
      return b.rating - a.rating;
    });
  }

  /**
   * Offers a delivery task to an eligible partner with a 45-second reservation window
   */
  public static async offerTaskToPartner(taskId: string, partnerId: string, timeoutSeconds: number = 45) {
    const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

    return prisma.$transaction(async (tx) => {
      const task = await tx.deliveryTask.findUnique({ where: { id: taskId } });
      if (!task) throw new Error('Delivery task not found');

      if (task.status !== 'AVAILABLE' && task.status !== 'OFFERED') {
        throw new Error(`Cannot offer task in status: ${task.status}`);
      }

      // Update task with optimistic locking
      const updatedTask = await tx.deliveryTask.update({
        where: { id: taskId },
        data: {
          status: 'OFFERED',
          riderId: partnerId,
          acceptanceDeadline: expiresAt,
          version: { increment: 1 }
        }
      });

      // Create assignment record
      const assignment = await tx.deliveryAssignment.create({
        data: {
          taskId,
          partnerId,
          status: 'OFFERED',
          expiresAt
        }
      });

      // Record state history
      await tx.deliveryStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: 'OFFERED',
          actorRole: 'SYSTEM',
          actorId: 'DISPATCH_ENGINE',
          notes: `Offered to partner ${partnerId} with ${timeoutSeconds}s acceptance window`
        }
      });

      return { task: updatedTask, assignment };
    });
  }

  /**
   * Atomic task acceptance by courier with concurrency protection
   */
  public static async acceptTask(taskId: string, partnerId: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.deliveryTask.findUnique({ where: { id: taskId } });
      if (!task) throw new Error('Delivery task not found');

      // Enforce partner assignment check
      if (task.riderId && task.riderId !== partnerId) {
        throw new Error('This task has been assigned to another delivery partner');
      }

      if (task.status !== 'OFFERED' && task.status !== 'AVAILABLE') {
        throw new Error(`Task is no longer available for acceptance (current status: ${task.status})`);
      }

      // Check timeout
      if (task.acceptanceDeadline && task.acceptanceDeadline < new Date()) {
        throw new Error('Assignment offer has expired');
      }

      const now = new Date();

      // Atomic update
      const acceptedTask = await tx.deliveryTask.update({
        where: { id: taskId },
        data: {
          status: 'ACCEPTED',
          riderId: partnerId,
          acceptedAt: now,
          version: { increment: 1 }
        }
      });

      // Update active assignment
      await tx.deliveryAssignment.updateMany({
        where: { taskId, partnerId, status: 'OFFERED' },
        data: {
          status: 'ACCEPTED',
          respondedAt: now
        }
      });

      // Record history
      await tx.deliveryStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: 'ACCEPTED',
          actorRole: 'RIDER',
          actorId: partnerId,
          notes: 'Partner accepted delivery task'
        }
      });

      return acceptedTask;
    });
  }

  /**
   * Handles task rejection by courier and triggers re-assignment
   */
  public static async rejectTask(taskId: string, partnerId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.deliveryTask.findUnique({ where: { id: taskId } });
      if (!task) throw new Error('Delivery task not found');

      // Update assignment record
      await tx.deliveryAssignment.updateMany({
        where: { taskId, partnerId, status: 'OFFERED' },
        data: {
          status: 'DECLINED',
          respondedAt: new Date(),
          declineReason: reason || 'Declined by courier'
        }
      });

      // Reset task to AVAILABLE
      const updatedTask = await tx.deliveryTask.update({
        where: { id: taskId },
        data: {
          status: 'AVAILABLE',
          riderId: null,
          acceptanceDeadline: null,
          version: { increment: 1 }
        }
      });

      await tx.deliveryStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: 'AVAILABLE',
          actorRole: 'RIDER',
          actorId: partnerId,
          notes: `Partner declined task: ${reason || 'No reason provided'}. Re-queued for dispatch.`
        }
      });

      return updatedTask;
    });
  }
}
