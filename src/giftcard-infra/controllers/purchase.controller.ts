import { Request, Response } from 'express';
import User from '@/models/user.model';
import * as purchaseService from '@/giftcard-infra/services/giftcard.service';
import { initMonnifyBankTransfer, initMonnifyTransaction } from '@/monnify-infra/services/monnify.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import { purchaseEmailHtml } from '@/lib/email-temeplate';

import { getNextSequence } from '@/lib/sequence';
import Transaction from '@/models/transaction.model';
import { logger } from '@/lib/winston';
import { UserService, VolumeType } from '@/services/user.service';
import { LedgerService } from '@/crypto-infra/services/ledger.service';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
  SystemAccount,
} from '@/crypto-infra/models/ledger.model';
import config from '@/config/config';
import mongoose from 'mongoose';

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
    const card = await purchaseService.getGiftCardById(giftCardId);
    const isTest = card?.name?.startsWith('TEST_');
    const reference = `${isTest ? 'TEST_' : ''}BGCTX_${req.userId}_${Date.now()}`;
    const txId = await getNextSequence('transactionId');
    /// FIX: Trying to resolve the issue of over charging users
    // const totalAmount = Number(amount) * Number(quantity); :: BEFORE
    const totalAmount = Number(amount); // AFTER

    // Create pending transaction
    const tx = await Transaction.create({
      id: txId,
      userId: user._id,
      type: 'buy_giftcard',
      coin: giftCardId, // Use giftCardId to help identification in verification
      fiat_amount: totalAmount.toFixed(2),
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
      amount: totalAmount,
    });

    // Initialize Monnify Payment
    // 1. Init Transaction to get Monnify Reference
    const initTxResponse = await initMonnifyTransaction({
      amount: totalAmount,
      customerName: `${user.firstname} ${user.lastname}`,
      customerEmail: user.email,
      paymentReference: reference,
      paymentDescription: `Gift Card Purchase - ${reference}`,
      currencyCode: 'NGN',
      contractCode: config.MONNIFY_CONTRACT_CODE!,
      redirectUrl: config.FRONTEND_URL,
      paymentMethods: ["ACCOUNT_TRANSFER"]
    });

    const monnifyRef = initTxResponse.responseBody.transactionReference;

    // Update transaction with Monnify reference
    tx.monnify_data = { ...tx.monnify_data, transactionReference: monnifyRef };
    await tx.save();

    // 2. Initialize Monnify Payment (Bank Transfer) using the Monnify Reference
    const monnifyResponse = await initMonnifyBankTransfer({
      transactionReference: monnifyRef,
      amount: totalAmount,
      customerName: `${user.firstname} ${user.lastname}`,
      customerEmail: user.email,
      paymentDescription: `Gift Card Purchase - ${reference}`,
      currencyCode: 'NGN',
      contractCode: config.MONNIFY_CONTRACT_CODE!,
    });

    res.status(201).json({
      success: true,
      data: {
        reference,
        amount: totalAmount,
        transactionId: txId,
        paymentDetails: monnifyResponse.responseBody, // Contains account number, bank, etc.
      },
    });
  },
);

// Internal function to be called after successful payment
// Now wrapped in a single Mongo session for atomicity.
export const fulfillGiftCardPurchase = async (transaction: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    const totalInNairaStr = String(purchase.totalInNaira);

    // Log to Ledger — double-entry (inside session)
    await LedgerService.recordEntry({
      userId: user._id.toString(),
      asset: purchase.detailsSnapshot.brandName,
      amount: totalInNairaStr,
      type: LedgerType.GIFTCARD_BUY,
      refId: `GCB-${purchase._id}`,
      category: LedgerCategory.GIFTCARD,
      action: TransactionAction.BUY,
      counterparty: SystemAccount.GIFTCARD_FLOAT,
      image: purchase.detailsSnapshot.image,
      status: 'completed',
      tradedAsset: purchase.detailsSnapshot.brandName,
      affectsBalance: false,
      session,
    });

    // Update User Trading Volume (inside session)
    await UserService.updateUserVolume(
      user._id.toString(),
      totalInNairaStr,
      VolumeType.BUY,
      session,
    );

    // Update transaction status (inside session)
    transaction.giftcard_data.purchase_result = purchase;
    transaction.status = 'completed';
    await transaction.save({ session });

    await session.commitTransaction();

    // send email (fire-and-forget, outside session)
    const html = purchaseEmailHtml(purchase);
    // sendPurchaseEmail(...)
    
    return purchase;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
