import redisClient from '@/config/redis.config';
import { Request, Response, NextFunction } from 'express';

export const validateTxGrant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const grantKey = `tx_grant:${userId}`;

  // 1. Check if the grant exists
  // 1. Check if the grant exists
  const client = await redisClient();
  const grant = await client.get(grantKey);

  if (!grant) {
    return res.status(403).json({
      error: 'Authorization Expired',
      message:
        'Transaction must be completed within 60 seconds of passcode entry.',
    });
  }

  // 2. IMPORTANT: Delete the grant immediately (Single Use)
  // This ensures the user must enter the passcode again for the NEXT transaction
  await client.del(grantKey);

  // 3. Move to the transaction function
  next();
};
