import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyObiexWebhook = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-obiex-signature'] as string;
  const webhookSecret = process.env.OBIEX_WH_SECRET;

  if (!signature) {
    return res.status(401).json({ status: false, message: 'Missing signature header' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ status: false, message: 'Webhook secret is not configured' });
  }

  // Access the raw body attached in server.ts
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    return res.status(400).json({ status: false, message: 'Raw body is required for signature verification' });
  }

  const expectedSignature = crypto
    .createHmac('sha512', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ status: false, message: 'Invalid signature' });
  }

  next();
};
