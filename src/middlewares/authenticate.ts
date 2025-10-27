import { logger } from '@/lib/winston';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import Token from '@/models/token';
import { verifyAccessToken } from '@/lib/jwt';

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // if there's no authorization header respond with 401
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'AuthenticationError',
      message: 'Access denied: no token provided.',
    });
    return;
  }

  // split out the token from the "Bearer <token>" string
  const token = authHeader.split(' ')[1];

  try {
    console.log('token here is:', token);
    const jwtPayload = verifyAccessToken(token) as {
      userId: Types.ObjectId;
    };
    // attach user info to request object
    req.userId = jwtPayload.userId;
    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        code: 'TokenExpiredError',
        message: 'Access denied: token has expired.',
        error: error,
      });
      return;
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        code: 'JsonWebTokenError',
        message: 'Access denied: invalid token.',
      });
      return;
    }

    res.status(500).json({
      code: 'InternalServerError',
      message: 'An internal server error occurred during authentication.',
    });
    logger.error('Error during authentication middleware.', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error,
    });
    return;
  }
};

export default authenticate;
