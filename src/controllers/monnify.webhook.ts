import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '@/lib/winston';
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

    // Find transaction by reference using Prisma
    const tx = await prisma.transaction.findUnique({
      where: { reference: paymentReference },
    });

    if (!tx) {
      logger.error(`Transaction not found for reference: ${paymentReference}`);
      return res.status(200).send('Transaction not found');
    }

    if (tx.status === 'SUCCESS' || tx.status === 'PROCESSING') {
      logger.info(`Transaction ${tx.id} already processed`);
      return res.status(200).send('Already processed');
    }

    // Mark as processing
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'PROCESSING',
        meta: {
          ...(tx.meta as any),
          monnify_data: { webhook_event: body }
        }
      }
    });

    if (tx.category === 'GIFTCARDS' && tx.type === 'DEBIT') {
      logger.info(`Webhook: Triggering Prisma GiftCard Fulfillment for TX ${tx.id}`);
      giftCardService.fulfillDirectOrder(tx.id).catch((err: any) => {
        logger.error(`Failed to fulfill Prisma giftcard order ${tx.id}`, err);
      });
    } else {
      logger.info(`Webhook: No automatic fulfillment logic for transaction category ${tx.category}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    logger.error('Error processing Monnify webhook:', error);
    res.status(500).send('Webhook error');
  }
};
