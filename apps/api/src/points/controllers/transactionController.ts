import { Response } from 'express';
import { UserModel } from '../../models/User';
import { OfferModel } from '../../models/Offer';
import { FundraisingModel } from '../../models/Fundraising';
import { PointTransactionModel } from '../../models/PointTransaction';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

export const redeemOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { offerId } = req.body;
    const offer = await OfferModel.findById(offerId);
    if (!offer || !offer.isActive) {
      res.status(404).json({ message: 'Offer not found' });
      return;
    }

    // Check for existing redemption
    const existingRedemption = await PointTransactionModel.findOne({
      username: req.user.username,
      targetId: offerId,
      type: 'REDEMPTION'
    });

    if (existingRedemption) {
      res.status(400).json({ message: 'Offer already redeemed' });
      return;
    }

    const user = await UserModel.findOne({ username: req.user.username });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const currentPoints = user.points || 0;

    if (currentPoints < offer.pointsCost) {
      res.status(400).json({ message: 'Insufficient points' });
      return;
    }

    // Deduct points
    user.points = currentPoints - offer.pointsCost;
    await user.save();

    // Record transaction
    await PointTransactionModel.create({
      username: user.username,
      amount: offer.pointsCost,
      type: 'REDEMPTION',
      targetId: offer.id
    });

    res.json({ message: 'Offer redeemed successfully', currentPoints: user.points });
  } catch (error: any) {
    console.error('Redeem error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const donatePoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { fundraisingId, pointsAmount } = req.body;
    if (!pointsAmount || pointsAmount <= 0) {
      res.status(400).json({ message: 'Invalid point amount' });
      return;
    }

    const fundraiser = await FundraisingModel.findById(fundraisingId);
    if (!fundraiser || !fundraiser.isActive) {
      res.status(404).json({ message: 'Fundraising campaign not found' });
      return;
    }

    const user = await UserModel.findOne({ username: req.user.username });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const currentPoints = user.points || 0;

    if (currentPoints < pointsAmount) {
      res.status(400).json({ message: 'Insufficient points' });
      return;
    }

    // Deduct from user
    user.points = currentPoints - pointsAmount;
    await user.save();

    // Add to project
    fundraiser.currentPoints = (fundraiser.currentPoints || 0) + pointsAmount;
    await fundraiser.save();

    // Record transaction
    await PointTransactionModel.create({
      username: user.username,
      amount: pointsAmount,
      type: 'DONATION',
      targetId: fundraiser.id
    });

    res.json({ message: 'Donation successful', currentPoints: user.points, fundraisedPoints: fundraiser.currentPoints });
  } catch (error: any) {
    console.error('Donate error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const transactions = await PointTransactionModel.find({ username: req.user.username }).sort('-timestamp');
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getHospitalRedemptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'HOSPITAL') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const myOffers = await OfferModel.find({ hospitalId: req.user.username });
    const myOfferIds = myOffers.map(o => o._id);

    const redemptions = await PointTransactionModel.find({
      targetId: { $in: myOfferIds },
      type: 'REDEMPTION'
    }).lean();

    const results = await Promise.all(redemptions.map(async (r) => {
      const user = await UserModel.findOne({ username: r.username }).select('fullName username email bloodGroup location phone nic dob weight').lean();
      return { ...r, userId: user }; // Keep 'userId' property name for frontend compatibility
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrganizationDonations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ORGANIZATION') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const myFundraisers = await FundraisingModel.find({ organizationId: req.user.username });
    const myFundraiserIds = myFundraisers.map(f => f._id);

    const donations = await PointTransactionModel.find({
      targetId: { $in: myFundraiserIds },
      type: 'DONATION'
    }).lean();

    const results = await Promise.all(donations.map(async (d) => {
      const user = await UserModel.findOne({ username: d.username }).select('fullName username email bloodGroup location phone nic dob weight').lean();
      return { ...d, userId: user }; // Keep 'userId' property name for frontend compatibility
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
