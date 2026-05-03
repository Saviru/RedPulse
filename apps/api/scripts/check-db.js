const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables specifically from the apps/api folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/redpulse';

console.log('Checking database connection before proceeding...');

// Attempt to connect to the database with a 5-second timeout
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Database connection successful!');
    // Disconnect so the script can exit cleanly
    return mongoose.disconnect();
  })
  .then(() => {
    process.exit(0); // Exit with success code
  })
  .catch((err) => {
    console.error('❌ Database connection failed. Please check your Atlas credentials or local database.');
    console.error(err.message);
    process.exit(1); // Exit with error code to stop the build
  });
