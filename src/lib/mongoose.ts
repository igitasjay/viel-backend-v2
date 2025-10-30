import mongoose from 'mongoose';
import config from '@/config';
import type { ConnectOptions } from 'mongoose';
import { logger } from '@/lib/winston';

const clientOptions: ConnectOptions = {
  dbName: 'blog-ts',
  appName: 'Blog TS',
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
    //     deprecationErrors: true,
  },
};

export const connectToDatabase = async (): Promise<void> => {
  const uri = config.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info('Connected to MongoDB');
      return;
    } catch (error) {
      retries -= 1;
      logger.warn(`MongoDB connection failed. Retries left: ${retries}`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  throw new Error('Failed to connect to MongoDB');
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.', {
      uri: config.MONGODB_URI,
      options: clientOptions,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    logger.error('Error disconnecting from MongoDB:', error);
  }
};
