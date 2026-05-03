import { Router } from 'express';
import { checkEligibility, getEligibilityHistory, getMeWithHistory } from '../controllers/eligibilityController';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { createUploadMiddleware } from '../../shared/middleware/upload.middleware';

export const eligibilityRouter = Router();
const uploadReports = createUploadMiddleware("medical-reports");

eligibilityRouter.use(requireAuth);

eligibilityRouter.get('/me', (req, res, next) => {
  getMeWithHistory(req, res).catch(next);
});

eligibilityRouter.post('/check', uploadReports.array('reports', 5), (req, res, next) => {
  checkEligibility(req, res).catch(next);
});

eligibilityRouter.get('/history', (req, res, next) => {
  getEligibilityHistory(req, res).catch(next);
});
