import type { Request, Response } from 'express';
import crypto from 'crypto';
import { LedgerService } from '../services/ledger.service';
import { LedgerCategory, LedgerType, TransactionAction, SystemAccount } from '../models/ledger.model';
import config from '@/config/config';
import { NotificationService } from '@/services/notification.service';
import * as Decimal from '@/utils/decimal.util';

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

      // Paystack amount is in Kobo (NGN * 100) — convert with Decimal
      const amountNGN = Decimal.fromMinorUnits(String(amount), 2);

      // 3. Credit Ledger (double-entry)
      try {
        await LedgerService.recordEntry({
          userId,
          asset: 'NGN',
          amount: amountNGN,
          type: LedgerType.DEPOSIT,
          refId: `PAYSTACK-${reference}`,
          category: LedgerCategory.CRYPTO,
          action: TransactionAction.SELL,
          counterparty: SystemAccount.REVENUE,
          status: 'completed',
          tradedAsset: 'NGN',
        });
        // Trigger notification
        await NotificationService.sendDepositNotification(userId, 'NGN', parseFloat(amountNGN));
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
