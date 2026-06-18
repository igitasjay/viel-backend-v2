import { Request, Response, NextFunction } from 'express';
import { IdempotencyModel } from '../models/idempotency.model';

export const requireIdempotencyKey = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['idempotency-key'] as string;

  if (!key) {
    return res.status(400).json({ status: false, message: 'Idempotency-Key header is required' });
  }

  try {
    const existing = await IdempotencyModel.findOne({ key });
    
    if (existing) {
      if (existing.responseBody) {
        // Return previous response if it was already processed successfully
        return res.status(200).json(JSON.parse(existing.responseBody));
      } else {
        // Transaction is currently being processed
        return res.status(409).json({ status: false, message: 'Request is already being processed' });
      }
    }

    // Create a lock for this key
    await IdempotencyModel.create({
      key,
      userId: (req as any).user?.id || (req as any).user?._id, // Assume auth middleware sets user
      endpoint: req.originalUrl,
    });

    // Override res.json to capture the response body once it is generated
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        IdempotencyModel.updateOne({ key }, { responseBody: JSON.stringify(body) }).exec();
      } else {
        // If the request failed, we remove the idempotency key so it can be retried
        IdempotencyModel.deleteOne({ key }).exec();
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error processing idempotency' });
  }
};
