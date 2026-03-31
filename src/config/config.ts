import dotenv from 'dotenv';

import type ms from 'ms';

dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  SHOW_TEST_ASSETS: process.env.SHOW_TEST_ASSETS === 'true',
  WHITELISTED_ORIGINS: process.env.WHITELISTED_ORIGINS!.split(','),
  MONGODB_URI: process.env.MONGODB_URI,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES as ms.StringValue,
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES as ms.StringValue,
  WHITELIST_ADMINS_EMAIL: process.env.WHITELIST_ADMINS_EMAIL!.split(','),
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  EMAIL_FROM: process.env.EMAIL_FROM!,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY!,
  TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY!,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY!,
  TENDERLY_RPC_URL: process.env.TENDERLY_RPC_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  RPC_URL: process.env.RPC_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  MONNIFY_API_KEY: process.env.MONNIFY_API_KEY!,
  MONNIFY_SECRET_KEY: process.env.MONNIFY_SECRET_KEY!,
  MONNIFY_CONTRACT_CODE: process.env.MONNIFY_CONTRACT_CODE!,
  MONNIFY_BASE_URL: process.env.MONNIFY_BASE_URL!,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  SERVER_URL: process.env.SERVER_URL!,
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID!,
  ONESIGNAL_REST_API_KEY: process.env.ONESIGNAL_REST_API_KEY!,
  ALCHEMY_RPC_URL: process.env.ALCHEMY_RPC_URL!,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  BITCOIN_API_URL: process.env.BITCOIN_API_URL || 'https://blockstream.info/api', // Public API for BTC
};

export default config;
