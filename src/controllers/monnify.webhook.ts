import { Request, Response } from 'express';
import crypto from 'crypto';
import Transaction from '@/models/transaction.model';
import { fulfillGiftCardPurchase } from '@/giftcard-infra/controllers/purchase.controller';
import { logger } from '@/lib/winston';
import { UserService, VolumeType } from '@/services/user.service';
// import { sendCrypto } from '@/lib/crypto-dispatch'; // Placeholder for crypto dispatch logic

export const handleMonnifyWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['monnify-signature'] as string;
    const body = req.body;

    if (!signature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    const computedHash = crypto
      .createHmac('sha512', process.env.MONNIFY_SECRET_KEY!)
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

    // Find transaction by reference (Monnify reference or our reference)
    // Note: If you used `transactionReference` as the payment reference in Init, it maps to `paymentReference` here.
    // If you used your own reference, Monnify returns it as `paymentReference`.
    const tx = await Transaction.findOne({ reference: paymentReference });

    if (!tx) {
      logger.error(`Transaction not found for reference: ${paymentReference}`);
      return res.status(200).send('Transaction not found'); // Return 200 to acknowledge webhook
    }

    if (tx.status === 'completed' || tx.status === 'paid' || tx.status === 'processing') {
      logger.info(`Transaction ${tx.id} already processed`);
      return res.status(200).send('Already processed');
    }

    // Update Transaction
    tx.status = 'paid';
    tx.monnify_data = { ...tx.monnify_data, webhook_event: body };
    await tx.save();

    // Trigger Fulfillment
    if (tx.type === 'buy_crypto') {
      logger.info(`Triggering Crypto Dispatch for TX ${tx.id}`);
        // Dispatch crypto logic here
        // await sendCrypto(tx.coin!, tx.network!, tx.crypto_amount!, tx.receive_address!);
        // tx.status = 'completed'; // Update status after successful dispatch
        // await tx.save();

        // Update User Trading Volume
        if (tx.fiat_amount) {
          await UserService.updateUserVolume(
            tx.userId.toString(),
            Number(tx.fiat_amount),
            VolumeType.BUY,
          );
        }
    } else if (tx.type === 'buy_giftcard') {
      logger.info(`GiftCard Purchase for TX ${tx.id} is now PAID. Awaiting Admin Approval.`);
      // Manual approval required - fulfilling happens via admin API
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    logger.error('Error processing Monnify webhook:', error);
    res.status(500).send('Webhook error');
  }
};
