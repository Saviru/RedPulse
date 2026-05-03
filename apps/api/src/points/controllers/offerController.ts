import { Request, Response } from 'express';
import { OfferModel } from '../../models/Offer';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

export const createOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'HOSPITAL') {
      res.status(403).json({ message: 'Only hospitals can create offers' });
      return;
    }

    const { title, description, pointsCost, type } = req.body;
    const offer = await OfferModel.create({
      title,
      description,
      pointsCost,
      type,
      hospitalId: req.user.username
    });
    res.status(201).json(offer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const offers = await OfferModel.find({ isActive: true }).sort('-createdAt');
    res.json(offers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
    }
    const { id } = req.params;
    const offer = await OfferModel.findOneAndUpdate(
      { _id: id, hospitalId: req.user.username },
      req.body,
      { new: true }
    );
    if (!offer) {
      res.status(404).json({ message: 'Offer not found or unauthorized' });
      return;
    }
    res.json(offer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const offer = await OfferModel.findOneAndUpdate(
       { _id: id, hospitalId: req.user.username },
       { isActive: false },
       { new: true }
    );
    if (!offer) {
       res.status(404).json({ message: 'Offer not found or unauthorized' });
       return;
    }
    res.json({ message: 'Offer deactivated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
