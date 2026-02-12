import { Request, Response, NextFunction } from 'express';

const restrictSuspended = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.accountStatus === 'suspended') {
    return res.status(403).json({
      code: 'AccountSuspendedError',
      message: 'Your account is suspended. You cannot perform this action.',
    });
  }
  next();
};

export default restrictSuspended;
