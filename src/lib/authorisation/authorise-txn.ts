import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '@/models/user.model';
import redisClient from '@/config/redis.config';

export const authorizeTransaction = async (req: Request, res: Response) => {
  const { userId, passcode } = req.body;

  try {
    // 1. Fetch from MONGODB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Compare input with hashed passcode in MongoDB
    const isValid = await bcrypt.compare(passcode, user.passcode!);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid passcode' });
    }

    // 3. Create the 60s "Permission Slip" in REDIS
    const grantKey = `tx_grant:${userId}`;
    // await redisClient.set(grantKey, 'true', { EX: 60 });

    return res.json({ message: 'Authorized! You have 60 seconds.' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
