// // src/middlewares/role-check.ts
// import { Request, Response, NextFunction } from 'express';
// import { logger } from '@/lib/winston';

// export const isAdmin = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   if (!req.userId) {
//     res.status(401).json({
//       code: 'Unauthorized',
//       message: 'Authentication required.',
//     });
//     return;
//   }

//   const userRole = (req as any).user?.role;

//   if (userRole !== 'admin') {
//     logger.warn('Unauthorized admin access attempt', {
//       userId: req.userId,
//       role: userRole,
//       path: req.originalUrl,
//       ip: req.ip,
//     });

//     res.status(403).json({
//       code: 'Forbidden',
//       message: 'Admin access required.',
//     });
//     return;
//   }

//   next();
// };
