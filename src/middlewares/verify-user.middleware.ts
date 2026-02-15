import type { Request, Response, NextFunction } from 'express';

const verifyUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.verifiedUser) {
    res.status(403).json({
      code: 'VerificationRequired',
      message: 'You must be a verified user to perform this action.',
    });
    return;
  }
  next();
};

export default verifyUser;
