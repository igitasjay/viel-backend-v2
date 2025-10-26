import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '@/lib/winston';
import Token from '@/models/token';
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;
  try {
    const tokenExists = await Token.findOne({ token: refreshToken });
    if (!tokenExists) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Invalid refresh token',
      });
      return;
    }

    // verify refresh token
    const jwtPayload = verifyRefreshToken(refreshToken) as {
      userId: Types.ObjectId;
    };
    const accessToken = generateAccessToken(jwtPayload.userId);
    res.status(200).json({
      accessToken,
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Refresh token has expired',
      });
      return;
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Invalid refresh token',
      });
      return;
    }
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: error,
    });
    logger.error('Error on refresh token', error);
  }
};

export default refreshToken;
