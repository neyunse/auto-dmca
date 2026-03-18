import mongoose from 'mongoose';
import { Alert } from './models/Alert.js';
import { Target } from './models/Target.js';
import { Config } from './models/Config.js';
import { Exclusion } from './models/Exclusion.js';

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

export { Alert, Target, Config, Exclusion };
