import { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import Transaction from '@/models/transaction.model';
import { getMonnifyTransactionStatus } from '@/monnify-infra/services/monnify.service';
import { fulfillGiftCardPurchase } from '@/giftcard-infra/controllers/purchase.controller';
import { logger } from '@/lib/winston';
import { UserService, VolumeType } from '@/services/user.service';
// import { sendCrypto } from '@/lib/crypto-dispatch';

export const verifyTransactionStatus = [
  param('reference').trim().notEmpty().withMessage('Reference is required'),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ code: 'ValidationError', errors: errors.array() });
      return;
    }

    const encodedReference = req.params.reference as string;
    const reference = decodeURIComponent(encodedReference);

    logger.info(`Verifying transaction with reference: ${reference} (original: ${encodedReference})`);

    try {
      // Find transaction by internal reference OR Monnify reference
      const tx = await Transaction.findOne({
        $or: [
          { reference: reference },
          { 'monnify_data.transactionReference': reference }
        ]
      });

      if (!tx) {
        logger.warn(`Transaction not found for reference: ${reference}`);
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }

      if (tx.status === 'paid' || tx.status === 'completed') {
        res.status(200).json({ message: 'Transaction already paid', status: tx.status });
        return;
      }

      // Check status with Monnify (using payment reference = our transaction reference)
      const monnifyStatus = await getMonnifyTransactionStatus(reference, true);

      if (!monnifyStatus.requestSuccessful) {
        res.status(400).json({ 
          message: 'Verification failed', 
          error: monnifyStatus.responseMessage || 'Monnify could not find this transaction' 
        });
        return;
      }

      if (monnifyStatus.responseBody.paymentStatus === 'PAID') {
        // Double check if already processed to prevent race conditions with webhook
        const freshTx = await Transaction.findOne({ reference });
        if (freshTx && (freshTx.status === 'paid' || freshTx.status === 'completed')) {
             res.status(200).json({ message: 'Transaction confirmed', status: freshTx.status });
             return;
        }

        // Update Status
        tx.status = 'paid';
        tx.monnify_data = { ...tx.monnify_data, manual_verification: monnifyStatus.responseBody };
        await tx.save();

         // Trigger Fulfillment
        if (tx.type === 'buy_crypto') {
           logger.info(`Manual Verify: Triggering Crypto Dispatch for TX ${tx.id}`);
           // await sendCrypto(...)
           // tx.status = 'completed';
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
           logger.info(`Manual Verify: Triggering GiftCard Fulfillment for TX ${tx.id}`);
           try {
             await fulfillGiftCardPurchase(tx);
           } catch(err) {
              logger.error('Fulfillment error', err);
           }
        }

        res.status(200).json({ message: 'Payment verified and processed', status: 'paid' });
      } else {
        res.status(200).json({ 
            message: 'Payment not yet confirmed', 
            status: monnifyStatus.responseBody.paymentStatus 
        });
      }

    } catch (error: any) {
      logger.error('Manual verification failed:', error);
      res.status(500).json({ message: 'Verification failed', error: error.message });
    }
  },
];
