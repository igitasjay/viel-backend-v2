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
  if (!config.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }
  try {
    await mongoose.connect(config.MONGODB_URI, clientOptions);
    logger.info('Connected to MongoDB successfully.', {
      uri: config.MONGODB_URI,
      options: clientOptions,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    logger.error('Error connecting to MongoDB:', error);
    throw error;
  }
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
