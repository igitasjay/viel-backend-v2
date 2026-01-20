import { Request, Response } from 'express';
import User from '@/models/user.model';
import * as purchaseService from '@/services/giftcard.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import { purchaseEmailHtml } from '@/lib/email-temeplate';

import { getNextSequence } from '@/lib/sequence';
import Transaction from '@/models/transaction.model';
import { logger } from '@/lib/winston';

export const initiateGiftCardPurchase = asyncHandler(
  async (req: Request, res: Response) => {
    const { giftCardId, amount, quantity, email } = req.body;
    const userId = req.userId?.toString();

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Generate reference
    const reference = `gift_${req.userId}_${Date.now()}`;
    const txId = await getNextSequence('transactionId');

    // Create pending transaction
    await Transaction.create({
      id: txId,
      userId: user._id,
      type: 'buy_giftcard',
      fiat_amount: (Number(amount) * Number(quantity)).toFixed(2),
      reference,
      status: 'pending',
      monnify_data: {
        initiation_source: 'frontend_bank_transfer',
      },
      giftcard_data: {
        giftCardId,
        amount,
        quantity,
        recipientEmail: email,
      },
    });

    logger.info('Gift card purchase initialized (pending payment)', {
      txId,
      reference,
      amount: amount * quantity,
    });

    res.status(201).json({
      success: true,
      data: {
        reference,
        amount: Number(amount) * Number(quantity),
        transactionId: txId,
      },
    });
  },
);

// Internal function to be called after successful payment
export const fulfillGiftCardPurchase = async (transaction: any) => {
  const { giftCardId, amount, quantity, recipientEmail } = transaction.giftcard_data;
  const user = await User.findById(transaction.userId);
  
  if (!user) {
    throw new Error('User not found for gift card fulfillment');
  }

  const fullName = `${user.firstname} ${user.lastname}`;

  const purchase = await purchaseService.purchaseGiftCard(
    user._id.toString(),
    fullName,
    user.email,
    giftCardId,
    Number(amount),
    Number(quantity),
    recipientEmail,
  );

  // Update transaction metadata with purchase result
  transaction.giftcard_data.purchase_result = purchase;
  transaction.status = 'completed'; // Or 'processing' depending on service response
  await transaction.save();

  // send email (fire-and-forget)
  const html = purchaseEmailHtml(purchase);
  // sendPurchaseEmail(...)
  
  return purchase;
};
