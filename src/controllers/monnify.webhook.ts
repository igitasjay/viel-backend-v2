import { Request, Response } from 'express';
import crypto from 'crypto';
import Transaction from '@/models/transaction.model';
import { fulfillGiftCardPurchase } from '@/giftcard-infra/controllers/purchase.controller';
import { logger } from '@/lib/winston';
import { UserService, VolumeType } from '@/services/user.service';

import { fulfillBuyCrypto } from '@/crypto-infra/controllers/trade.controller';
import config from '@/config/config';

const MONNIFY_IPS = ['35.242.133.146', '34.89.51.11', '::ffff:35.242.133.146', '::ffff:34.89.51.11'];

export const handleMonnifyWebhook = async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress;
    if (config.NODE_ENV === 'production' && clientIp && !MONNIFY_IPS.includes(clientIp)) {
      logger.warn(`Unauthorized IP attempted Monnify webhook access: ${clientIp}`);
      return res.status(403).json({ message: 'Forbidden IP' });
    }

    const signature = req.headers['monnify-signature'] as string;
    const body = req.body;

    if (!signature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    if (!body || typeof body.eventType !== 'string' || !body.eventData || typeof body.eventData !== 'object') {
       logger.warn('Invalid webhook body structure from payload');
       return res.status(400).json({ message: 'Invalid payload structure' });
    }

    const computedHash = crypto
      .createHmac('sha512', config.MONNIFY_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');

    if (computedHash !== signature) {
      logger.warn('Invalid Monnify webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const { transactionReference, paymentReference, amountPaid, paymentStatus } = body.eventData;

    logger.info(`Received Monnify webhook: ${body.eventType} for ${transactionReference}`);

    if (body.eventType !== 'SUCCESSFUL_TRANSACTION' || paymentStatus !== 'PAID') {
      return res.status(200).send('Ignored non-success event');
    }

    // Find transaction by reference
    const tx = await Transaction.findOne({ reference: paymentReference });

    if (!tx) {
      logger.error(`Transaction not found for reference: ${paymentReference}`);
      return res.status(200).send('Transaction not found'); // Return 200 to acknowledge webhook
    }

    if (tx.status === 'completed' || tx.status === 'processing') {
      logger.info(`Transaction ${tx.id} already processed`);
      return res.status(200).send('Already processed');
    }

    // Mark as processing (pre-fulfillment state)
    // fulfillBuyCrypto and fulfillGiftCardPurchase now handle their own sessions
    // and set the final status atomically inside the session.
    tx.status = 'processing';
    tx.monnify_data = { ...tx.monnify_data, webhook_event: body };
    await tx.save();

    // Trigger Fulfillment (each function manages its own atomic session)
    if (tx.type === 'buy_crypto') {
      logger.info(`Webhook: Triggering Crypto Dispatch/Fulfillment for TX ${tx.id}`);
      await fulfillBuyCrypto(tx);
    } else if (tx.type === 'buy_giftcard') {
      logger.info(`GiftCard Purchase for TX ${tx.id} is now PAID. Awaiting Admin Approval.`);
      // Manual approval required - fulfilling happens via admin API
      // Set final status for giftcard to 'paid' (not 'completed')
      tx.status = 'paid';
      await tx.save();
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    logger.error('Error processing Monnify webhook:', error);
    res.status(500).send('Webhook error');
  }
};
