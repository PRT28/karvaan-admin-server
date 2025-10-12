import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async () => {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    throw new Error('Environment variable DB_URL is not defined');
  }

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(dbUrl);

    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};
