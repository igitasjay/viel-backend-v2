import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '@/lib/winston';
import config from '@/config/config';
import { prisma } from '@/shared/db/prisma';
import { giftCardService } from '@/internals/giftcard/services/buy-giftcard.service';
import { publishToQueue } from '@/shared/workers/publisher';

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

    const eventType = body.eventType;
    logger.info(`Received Monnify webhook: ${eventType}`);

    if (eventType === 'SUCCESSFUL_TRANSACTION' && body.eventData.paymentStatus === 'PAID') {
      const paymentReference = body.eventData.paymentReference;

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

      return res.status(200).send('Webhook processed');
    } 
    else if (['SUCCESSFUL_DISBURSEMENT', 'FAILED_DISBURSEMENT', 'REVERSED_DISBURSEMENT'].includes(eventType)) {
      const reference = body.eventData.reference;
      
      const tx = await prisma.transaction.findUnique({
        where: { reference: reference },
      });

      if (!tx) {
        logger.error(`Disbursement Transaction not found for reference: ${reference}`);
        return res.status(200).send('Transaction not found');
      }

      if (tx.status === 'SUCCESS' || tx.status === 'MANUAL_PAYOUT' || tx.status === 'FAILED') {
        logger.info(`Disbursement Transaction ${tx.id} already finalized (status: ${tx.status})`);
        return res.status(200).send('Already finalized');
      }

      if (eventType === 'SUCCESSFUL_DISBURSEMENT') {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'SUCCESS',
            meta: {
              ...(tx.meta as any),
              monnify_disbursement: body
            }
          }
        });
        logger.info(`Disbursement ${tx.id} marked as SUCCESS.`);

        publishToQueue({
          type: "NOTIFICATION_EVENT",
          payload: {
            userId: tx.userId,
            notificationType: "TRANSACTION",
            priority: "high",
            title: "Withdrawal Successful",
            message: `Your withdrawal of ₦${Number(tx.amount).toFixed(2)} has been successfully processed to your bank account.`,
            deliveryChannels: ["push", "in_app"],
            meta: {
              transactionId: tx.id,
              reference: tx.reference,
              amount: tx.amount,
            },
          },
        }).catch(err => logger.error("Failed to publish success event", err));
      } else {
        // Failed or Reversed disbursement -> MANUAL_PAYOUT
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'MANUAL_PAYOUT',
            narration: tx.narration ? `${tx.narration} - Failed via Monnify webhook` : 'Failed via Monnify webhook',
            meta: {
              ...(tx.meta as any),
              monnify_disbursement: body
            }
          }
        });
        logger.info(`Disbursement ${tx.id} failed/reversed. Marked as MANUAL_PAYOUT.`);

        publishToQueue({
          type: "NOTIFICATION_EVENT",
          payload: {
            userId: tx.userId,
            notificationType: "TRANSACTION",
            priority: "high",
            title: "Withdrawal Delayed",
            message: `Your withdrawal of ₦${Number(tx.amount).toFixed(2)} encountered an issue at the bank and is currently under manual review.`,
            deliveryChannels: ["push", "in_app"],
            meta: {
              transactionId: tx.id,
              reference: tx.reference,
              amount: tx.amount,
            },
          },
        }).catch(err => logger.error("Failed to publish delay event", err));
      }

      return res.status(200).send('Disbursement Webhook processed');
    }

    return res.status(200).send('Ignored event type');
  } catch (error) {
    logger.error('Error processing Monnify webhook:', error);
    res.status(500).send('Webhook error');
  }
};
