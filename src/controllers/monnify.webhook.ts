import { Request, Response } from 'express';
import crypto from 'crypto';
import Transaction from '@/models/transaction.model';
import { fulfillGiftCardPurchase } from '@/giftcard-infra/controllers/purchase.controller';
import { logger } from '@/lib/winston';
import { UserService, VolumeType } from '@/services/user.service';

import { CryptoBuyService } from '@/crypto-v2/services/crypto-buy.service';
import config from '@/config/config';
import { prisma } from '@/shared/db/prisma';
import { giftCardService } from '@/internals/giftcard/services/buy-giftcard.service';

const MONNIFY_IPS = ['35.242.133.146', '34.89.51.11', '::ffff:35.242.133.146', '::ffff:34.89.51.11'];

export const handleMonnifyWebhook = async (req: Request, res: Response) => {
  logger.info('monnify webhook body', req.body);

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
    let isPrismaTx = false;
    let prismaTx = null;

    if (!tx) {
      // Try Prisma
      prismaTx = await prisma.transaction.findUnique({
        where: { reference: paymentReference },
      });

      if (!prismaTx) {
        logger.error(`Transaction not found for reference: ${paymentReference}`);
        return res.status(200).send('Transaction not found');
      }
      isPrismaTx = true;
    }

    if (isPrismaTx && prismaTx) {
      if (prismaTx.status === 'SUCCESS' || prismaTx.status === 'PROCESSING') {
        logger.info(`Prisma Transaction ${prismaTx.id} already processed`);
        return res.status(200).send('Already processed');
      }

      await prisma.transaction.update({
        where: { id: prismaTx.id },
        data: {
          status: 'PROCESSING',
          meta: {
            ...(prismaTx.meta as any),
            monnify_data: { webhook_event: body }
          }
        }
      });

      if (prismaTx.category === 'GIFTCARDS' && prismaTx.type === 'DEBIT') {
        logger.info(`Webhook: Triggering Prisma GiftCard Fulfillment for TX ${prismaTx.id}`);
        giftCardService.fulfillDirectOrder(prismaTx.id).catch((err: any) => {
          logger.error(`Failed to fulfill Prisma giftcard order ${prismaTx.id}`, err);
        });
      }

      return res.status(200).send('Webhook processed');
    }

    if (tx!.status === 'completed' || tx!.status === 'processing') {
      logger.info(`Transaction ${tx!.id} already processed`);
      return res.status(200).send('Already processed');
    }

    // Mark as processing (pre-fulfillment state)
    // fulfillBuyCrypto and fulfillGiftCardPurchase now handle their own sessions
    // and set the final status atomically inside the session.
    tx!.status = 'processing';
    tx!.monnify_data = { ...tx!.monnify_data, webhook_event: body };
    await tx!.save();

    // Trigger Fulfillment (each function manages its own atomic session)
    if (tx!.type === 'buy_crypto') {
      logger.info(`Webhook: Triggering Crypto Dispatch/Fulfillment for TX ${tx!.id}`);
      await CryptoBuyService.handleMonnifyPaymentSuccess(tx!);
    } else if (tx!.type === 'buy_giftcard') {
      logger.info(`GiftCard Purchase for TX ${tx!.id} is now PAID. Awaiting Admin Approval.`);
      // Manual approval required - fulfilling happens via admin API
      // Set final status for giftcard to 'paid' (not 'completed')
      tx!.status = 'paid';
      await tx!.save();
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    logger.error('Error processing Monnify webhook:', error);
    res.status(500).send('Webhook error');
  }
};
