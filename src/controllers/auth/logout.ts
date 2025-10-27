import config from '@/config';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';
import Token from '@/models/token';

const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (refreshToken) {
      await Token.deleteOne({ token: refreshToken });
      logger.info('Refresh token deleted during logout.', {
        userId: req.userId,
        token: refreshToken,
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.sendStatus(204);
    logger.info('User logged out successfully.', {
      userId: req.userId,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    logger.error('Error during logout.', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error,
    });
  }
};

export default logout;
