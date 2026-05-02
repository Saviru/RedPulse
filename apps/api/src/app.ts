import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandler } from './shared/middleware/errorHandler.middleware';
import authRoutes from './auth/routes/authRoutes';
import userRoutes from './auth/routes/userRoutes';
import pointRoutes from './points/routes/pointRoutes';
import { emergencyRouter } from './emergency-alerts/routes/emergency.routes';
import { bloodRequestRouter } from './emergency-alerts/routes/blood-request.routes';

import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health Check for App Pre-launch
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ status: 'ok', db: dbStatus });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/points', pointRoutes);

// Duplicate under /api for secondary mobile client compatibility
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/points', pointRoutes);
app.use('/api', emergencyRouter);
app.use('/api', bloodRequestRouter);

app.use(errorHandler);

export default app;
