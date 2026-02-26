import { Request, Response } from 'express';
import Transaction from '@/models/transaction.model';
import { fulfillGiftCardPurchase } from '@/giftcard-infra/controllers/purchase.controller';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import { logger } from '@/lib/winston';

/**
 * List all gift card purchase transactions.
 * Optional query param: ?status=paid
 */
export const listGiftCardPurchases = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: any = { type: 'buy_giftcard' };
  
  if (status) {
    filter.status = status;
  }

  const purchases = await Transaction.find(filter)
    .sort({ created_at: -1 })
    .populate('userId', 'email firstname lastname');

  res.json({ success: true, data: purchases });
});

/**
 * Approve a gift card purchase request.
 * Query param: ?transactionId=123
 */
export const approveGiftCardPurchase = asyncHandler(async (req: Request, res: Response) => {
  const txId = req.query.transactionId as string;
  
  if (!txId) {
    throw new ApiError(400, 'transactionId query parameter is required');
  }

  const transaction = await Transaction.findOne({ id: Number(txId), type: 'buy_giftcard' });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  if (transaction.status !== 'paid' && transaction.status !== 'pending') {
    // We allow pending too just in case manual confirmation is needed for non-webhook payments
    // but ideally it should be 'paid'.
    throw new ApiError(400, `Transaction cannot be approved. Current status: ${transaction.status}`);
  }

  logger.info(`Admin approving GiftCard Purchase for TX ${transaction.id}`);
  
  const purchase = await fulfillGiftCardPurchase(transaction);

  res.json({ 
    success: true, 
    message: 'Gift card purchase approved and fulfilled successfully',
    data: purchase 
  });
});

/**
 * Decline a gift card purchase request.
 * Query param: ?transactionId=123
 */
export const declineGiftCardPurchase = asyncHandler(async (req: Request, res: Response) => {
  const txId = req.query.transactionId as string;
  const { adminComment } = req.body;

  if (!txId) {
    throw new ApiError(400, 'transactionId query parameter is required');
  }

  const transaction = await Transaction.findOne({ id: Number(txId), type: 'buy_giftcard' });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  transaction.status = 'failed';
  transaction.metadata = { 
    ...transaction.metadata, 
    admin_action: 'declined',
    admin_comment: adminComment,
    declined_at: new Date()
  };
  
  await transaction.save();

  logger.info(`Admin declined GiftCard Purchase for TX ${transaction.id}`);
  
  res.json({ 
    success: true, 
    message: 'Gift card purchase request declined' 
  });
});
