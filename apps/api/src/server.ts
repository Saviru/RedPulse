import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
// use Google DNS
dns.setServers(['8.8.8.8']);

import mongoose from 'mongoose';
import app from './app';

import { runExpiringSoonAlertJob, startExpiringSoonAlertScheduler } from './jobs/expiringSoonAlertJob';
import { runLowInventoryAlertJob, startLowInventoryAlertScheduler } from './jobs/lowInventoryAlertJob';


const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

async function startServer() {
  try {
    // Database Connection Event Listeners
    mongoose.connection.on('connected', () => {
      console.log('DB [Success]: Connected to MongoDB database');
    });

    mongoose.connection.on('error', (err) => {
      console.error('DB [Error]: MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('DB [Warning]: Disconnected from MongoDB database');
    });

    // Only connect if not run in testing
    if (process.env.NODE_ENV !== 'test') {

      // Safety check for Azure
      if (!MONGODB_URI) {
        console.error('DB [Fatal]: MONGODB_URI environment variable is missing! Check Azure Configuration.');
        process.exit(1);
      }

      console.log('DB [Request]: Attempting to connect to MongoDB...');
      // force IPv4 and bypass IPv6 DNS timeouts
      await mongoose.connect(MONGODB_URI, { family: 4 });

      // Initialize background jobs
      await runExpiringSoonAlertJob();
      startExpiringSoonAlertScheduler();

      await runLowInventoryAlertJob();
      startLowInventoryAlertScheduler();
    }

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();