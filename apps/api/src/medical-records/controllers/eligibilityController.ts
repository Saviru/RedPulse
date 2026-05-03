import { Response } from 'express';
import { EligibilityService } from '../services/eligibilityService';
import { validateEligibilityInput } from '../validators/eligibilityValidator';
import { HealthAssessment } from '../models/HealthAssessment';
import { DonationRecord } from '../models/DonationRecord';
import { UserModel as User } from '../../models/User';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

export const getMeWithHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findOne({ username }).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const donationHistory = await DonationRecord.find({ userId: user._id }).sort({ donationDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          name: (user as any).fullName || user.username,
          age: (user as any).dob ? Math.floor((new Date().getTime() - new Date((user as any).dob).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
          bloodType: (user as any).bloodGroup || 'Unknown'
        },
        donationHistory
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = validateEligibilityInput(req.body);
    if (!validation.isValid || !validation.parsedData) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    const username = req.user?.username;
    if (!username) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userId = user._id;
    
    const result = await EligibilityService.evaluateEligibility(validation.parsedData, userId as any);

    try {
      const assessment = new HealthAssessment({
        userId,
        isEligible: result.isEligible,
        reasonsForIneligibility: result.reasons,
        metrics: {
          hemoglobinLevel: validation.parsedData.hemoglobinLevel,
          bloodPressureSystolic: validation.parsedData.bloodPressureSystolic,
          bloodPressureDiastolic: validation.parsedData.bloodPressureDiastolic,
        },
        medicalReports: req.files ? (req.files as Express.Multer.File[]).map(f => `/uploads/medical-reports/${f.filename}`) : []
      });
      await assessment.save();
      console.log("Saved assessment to MongoDB!");
    } catch (saveError) {
      console.error('Error saving assessment to MongoDB:', saveError);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Eligibility Controller Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getEligibilityHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const history = await HealthAssessment.find({ userId: user._id })
      .select('isEligible reasonsForIneligibility createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Fetch History Controller Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
