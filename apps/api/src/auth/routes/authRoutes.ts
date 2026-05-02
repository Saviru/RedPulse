import { Router } from 'express';
import { registerUser, loginUser, exchangeToken, getMe, updateProfile, verifyRegistration, requestDelete, confirmDelete, resendOtp } from '../controllers/authController';
import { registerValidator, loginValidator, tokenExchangeValidator, verifyRegistrationValidator, confirmDeleteValidator } from '../validators/authValidator';
import { validateRequest } from '../../shared/middleware/validation.middleware';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { upload } from '../../shared/middleware/upload.middleware';

const router = Router();

router.post('/register', upload.single('avatar'), registerValidator, validateRequest, registerUser);
router.post('/verify-registration', verifyRegistrationValidator, validateRequest, verifyRegistration);
router.post('/resend-otp', validateRequest, resendOtp);
router.post('/login', loginValidator, validateRequest, loginUser);
router.post('/token', tokenExchangeValidator, validateRequest, exchangeToken);

// loading initial setup / getMe
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/request-delete', requireAuth, requestDelete);
router.post('/confirm-delete', requireAuth, confirmDeleteValidator, validateRequest, confirmDelete);

export default router;
