import express, { Response } from 'express';
import { prisma } from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

export const communityRouter = express.Router();

/**
 * 1. List Active Community Buying Campaigns
 */
communityRouter.get('/campaigns', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.communityCampaign.findMany({
      where: { status: 'ACTIVE' },
      include: { store: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Pledge to a Community Campaign
 */
communityRouter.post('/campaigns/:id/pledge', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const pledgeQty = Number(quantity) || 1;

    const campaign = await prisma.communityCampaign.findUnique({ where: { id } });
    if (!campaign) {
      res.status(404).json({ error: 'Community campaign not found' });
      return;
    }

    const updated = await prisma.communityCampaign.update({
      where: { id },
      data: {
        currentPledged: campaign.currentPledged + pledgeQty,
        currentParticipants: campaign.currentParticipants + 1
      }
    });

    res.json({ success: true, campaign: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
