import { Router } from 'express';
import { updateProfile, getDonors, getPublicStats } from '../controllers/userController';
import { requestDelete, confirmDelete } from '../controllers/authController';
import { updateProfileValidator, confirmDeleteValidator } from '../validators/authValidator';
import { validateRequest } from '../../shared/middleware/validation.middleware';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { upload } from '../../shared/middleware/upload.middleware';

const router = Router();

router.put('/profile', requireAuth, upload.single('avatar'), updateProfileValidator, validateRequest, updateProfile);
router.post('/request-delete', requireAuth, requestDelete);
router.post('/confirm-delete', requireAuth, confirmDeleteValidator, validateRequest, confirmDelete);
router.get('/donors', requireAuth, getDonors);
router.get('/stats', requireAuth, getPublicStats);


export default router;
