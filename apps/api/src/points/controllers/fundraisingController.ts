import { Request, Response } from 'express';
import { FundraisingModel } from '../../models/Fundraising';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

export const createFundraising = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ORGANIZATION') {
      res.status(403).json({ message: 'Only organizations can create fundraisings' });
      return;
    }

    const { title, description, goalLKR } = req.body;
    const fundraiser = await FundraisingModel.create({
      title,
      description,
      goalLKR,
      organizationId: req.user.id
    });
    res.status(201).json(fundraiser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFundraisings = async (req: Request, res: Response): Promise<void> => {
  try {
    const fundraisings = await FundraisingModel.find({ isActive: true }).sort('-createdAt');
    res.json(fundraisings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFundraising = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const fundraiser = await FundraisingModel.findOneAndUpdate(
       { _id: id, organizationId: req.user.id },
       req.body,
       { new: true }
    );
    if (!fundraiser) {
       res.status(404).json({ message: 'Fundraising not found or unauthorized' });
       return;
    }
    res.json(fundraiser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFundraising = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
     if (!req.user) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
     }
     const { id } = req.params;
     const fundraiser = await FundraisingModel.findOneAndUpdate(
        { _id: id, organizationId: req.user.id },
        { isActive: false },
        { new: true }
     );
     if (!fundraiser) {
        res.status(404).json({ message: 'Fundraising not found or unauthorized' });
        return;
     }
     res.json({ message: 'Fundraising deactivated' });
   } catch (error: any) {
     res.status(500).json({ message: error.message });
   }
};
