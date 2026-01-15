import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/api-error.util';
import { logger } from '@/lib/winston';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { status, message } = err;

  if (!(err instanceof ApiError)) {
    status = err.status || 500;
    message = err.message || 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (status === 500) {
    logger.error(err);
  }

  res.status(status).json(response);
};
