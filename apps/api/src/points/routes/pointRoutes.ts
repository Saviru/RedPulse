import { Router } from 'express';
import { createOffer, getOffers, updateOffer, deleteOffer } from '../controllers/offerController';
import { createFundraising, getFundraisings, updateFundraising, deleteFundraising } from '../controllers/fundraisingController';
import { redeemOffer, donatePoints, getTransactions, getHospitalRedemptions, getOrganizationDonations } from '../controllers/transactionController';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

// Hospital Offers
router.post('/offers', requireAuth, createOffer);
router.get('/offers', getOffers);
router.put('/offers/:id', requireAuth, updateOffer);
router.delete('/offers/:id', requireAuth, deleteOffer);

// Organization Fundraisings
router.post('/fundraising', requireAuth, createFundraising);
router.get('/fundraising', getFundraisings);
router.put('/fundraising/:id', requireAuth, updateFundraising);
router.delete('/fundraising/:id', requireAuth, deleteFundraising);

// User Transactions
router.post('/redeem', requireAuth, redeemOffer);
router.post('/donate', requireAuth, donatePoints);
router.get('/transactions', requireAuth, getTransactions);
router.get('/hospital/redemptions', requireAuth, getHospitalRedemptions);
router.get('/organization/donations', requireAuth, getOrganizationDonations);

export default router;
