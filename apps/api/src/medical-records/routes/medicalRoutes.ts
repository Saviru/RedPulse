import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getRecordsByCategory,
  uploadRecord,
  updateRecord,
  deleteRecord
} from '../controllers/medicalController';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../../uploads/medical');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Apply authentication to all routes
router.use(requireAuth);

// Category Routes
router.post('/categories', createCategory);
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Record Routes
router.get('/categories/:categoryId/records', getRecordsByCategory);
router.post('/records', upload.single('document'), uploadRecord);
router.put('/records/:id', updateRecord);
router.delete('/records/:id', deleteRecord);

export const medicalRouter = router;
