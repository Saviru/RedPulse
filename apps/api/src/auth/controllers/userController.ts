import { Response } from 'express';
import { UserModel } from '../../models/User';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { CampaignRegistrationModel } from '../../models/CampaignRegistration';


export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.username) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await UserModel.findOne({ username: req.user.username });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (req.file) {
      req.body.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Protection against unwanted field updates
    const updates = { ...req.body };
    delete updates.passwordHash;
    delete updates.role;
    delete updates.username;
    delete updates.email;

    Object.assign(user, updates);
    await user.save();

    const updatedUser = await UserModel.findOne({ username: user.username }).select('-passwordHash');

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDonors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'HOSPITAL' && req.user.role !== 'ORGANIZATION')) {
      res.status(403).json({ message: 'Access denied: Only Hospitals and Organizations can view donors' });
      return;
    }

    const donors = await UserModel.find({ role: 'USER' }).select('-passwordHash');
    res.json(donors);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalDonors = await UserModel.countDocuments({ role: 'USER' });
    const totalDonations = await CampaignRegistrationModel.countDocuments({
      role: 'DONOR',
      donationStatus: 'DONATION_COMPLETED'
    });
    const totalLivesSaved = totalDonations * 3;
    const totalVolunteers = await CampaignRegistrationModel.countDocuments({
      role: 'VOLUNTEER',
      status: 'REGISTERED'
    });

    res.json({
      totalDonors,
      totalDonations,
      totalLivesSaved,
      totalVolunteers
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

