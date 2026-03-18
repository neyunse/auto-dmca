import mongoose from 'mongoose';
import { Alert } from './packages/database/src/models/Alert.js';
import { Target } from './packages/database/src/models/Target.js';

export const connectDB = async (uri) => {
  try {
    if (!uri) throw new Error('MongoDB URI is missing');
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

export { Alert, Target };
