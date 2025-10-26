import dotenv from 'dotenv';

import type ms from 'ms';

dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  WHITELISTED_ORIGINS: ['http://localhost:1200'],
  MONGODB_URI: process.env.MONGODB_URI,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES as ms.StringValue,
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES as ms.StringValue,
};

export default config;
