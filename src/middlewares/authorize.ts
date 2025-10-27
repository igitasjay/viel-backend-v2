import { logger } from '@/lib/winston';
import User from '@/models/user';
import type { Request, Response, NextFunction } from 'express';

export type AuthRole = 'admin' | 'user';

const authorize = (roles: AuthRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    try {
      const user = await User.findById(req.userId).select('role').exec();

      if (!user || !roles.includes(user.role as AuthRole)) {
        res.status(403).json({
          code: 'AuthorizationError',
          message: 'Access denied: insufficient permissions.',
        });
        return;
      }

      return next();
    } catch (error) {
      res.status(500).json({
        code: 'ServerError',
        message: 'An internal server error occurred during authorization.',
      });
      logger.error('Error during authorization middleware.', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error,
      });
    }
  };
};

export default authorize;
