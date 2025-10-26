/*
 * @copyright 2024 Your Name
 * @license Apache-2.0
 */

import jwt from 'jsonwebtoken';
import config from '@/config';
import { Types } from 'mongoose';

export const generateAccessToken = (userId: Types.ObjectId): string => {
  return jwt.sign({ userId }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRES,
    subject: 'accessApi',
  });
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES,
    subject: 'refreshToken',
  });
};
