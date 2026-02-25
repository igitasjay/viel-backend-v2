import type { Request, Response } from 'express';
import crypto from 'crypto';
import { LedgerService } from '../services/ledger.service';
import { LedgerCategory, LedgerType, TransactionAction } from '../models/ledger.model';
import config from '@/config/config';

const PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY;

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Verify Signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    // 2. Handle Event
    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      const userId = metadata.custom_fields?.find(
        (f: any) => f.variable_name === 'user_id',
      )?.value;

      if (!userId) return res.sendStatus(200); // Ignore if no user attached

      // Paystack amount is in Kobo (NGN * 100)
      const amountNGN = amount / 100;

      // 3. Credit Ledger
      try {
        await LedgerService.creditUser(
          userId,
          'NGN',
          amountNGN,
          LedgerType.DEPOSIT,
          `PAYSTACK-${reference}`,
          LedgerCategory.CRYPTO,
          TransactionAction.SELL,
        );
      } catch (e) {
        console.log('Duplicate Paystack Event:', reference);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
