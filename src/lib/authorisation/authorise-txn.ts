import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '@/models/user.model';
import redisClient from '@/config/redis.config';

export const authorizeTransaction = async (req: Request, res: Response) => {
  const { userId, passcode } = req.body;

  try {
    // 1. Fetch from MONGODB
    // We must explicitly select passcode as it is select: false by default
    const user = await User.findById(userId).select('+passcode');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Compare input with hashed passcode in MongoDB
    if (!user.passcode) {
        return res.status(400).json({ error: 'Passcode not set for user' });
    }
    const isValid = await bcrypt.compare(passcode, user.passcode);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid passcode' });
    }

  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
