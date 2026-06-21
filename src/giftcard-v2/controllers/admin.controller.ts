import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import GiftcardSaleV2 from '../models/giftcard-sale.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/user.model';
import BankAccount from '@/models/bank.model';
import { disburseFunds } from '@/monnify-infra/services/monnify.service';
import { LedgerService } from '@/crypto-infra/services/ledger.service';
import { LedgerType, LedgerCategory, TransactionAction, SystemAccount } from '@/crypto-infra/models/ledger.model';
import mongoose from 'mongoose';
import { getReloadlyProducts } from '../services/reloadly.service';
import GiftcardProductV2 from '../models/giftcard-product.model';

export const approveSale = asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const { adminComment } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await GiftcardSaleV2.findById(saleId).session(session);
    if (!sale) throw new ApiError(404, 'Sale not found');
    if (sale.status !== 'SUBMITTED') throw new ApiError(400, 'Sale is already processed');

    const user = await User.findById(sale.userId).session(session);
    if (!user) throw new ApiError(404, 'User not found');

    const bankAccount = await BankAccount.findOne({ userId: user._id }).session(session);
    if (!bankAccount) throw new ApiError(400, 'User has no registered bank account for payout');

    const tx = await Transaction.findOne({ 'giftcard_data.saleId': sale._id, type: 'sell_giftcard_v2' }).session(session);
    if (!tx) throw new ApiError(404, 'Associated transaction not found');

    // 1. Mark Sale and Transaction as Approved/Completed
    sale.status = 'APPROVED';
    sale.adminComment = adminComment;
    await sale.save({ session });

    tx.status = 'completed';
    await tx.save({ session });

    // 2. Ledger Logging
    await LedgerService.recordEntry({
      userId: user._id.toString(),
      asset: 'NGN', // Payout is fiat
      amount: sale.expectedPayout.toString(),
      type: LedgerType.GIFTCARD_SELL,
      refId: `GCS-V2|${sale._id}`,
      category: LedgerCategory.GIFTCARD,
      action: TransactionAction.SELL,
      counterparty: SystemAccount.GIFTCARD_FLOAT,
      status: 'completed',
      tradedAsset: sale.brandName,
      affectsBalance: true,
      session,
    });

    // 3. Update User Trading Volume
    user.netTradingVolumn = (Number(user.netTradingVolumn || '0') + sale.expectedPayout).toString();
    user.totalSellVolume = (Number(user.totalSellVolume || '0') + sale.expectedPayout).toString();
    await user.save({ session });

    // 4. Trigger Monnify Disbursement (outside of DB transaction if we want to ensure it happens or within if we can reliably rollback on fail)
    // Monnify API call can throw, which will abort the session if it fails.
    const disburseResponse = await disburseFunds({
      amount: sale.expectedPayout,
      reference: `DISB_GCS_${sale._id}_${Date.now()}`,
      narration: `Giftcard Sale Payout - ${sale.brandName}`,
      destinationBankCode: bankAccount.bankCode,
      destinationAccountNumber: bankAccount.accountNumber,
      currency: 'NGN'
    });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Sale approved and payout initiated',
      data: { sale, disbursement: disburseResponse }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const syncProducts = asyncHandler(async (req: Request, res: Response) => {
  const data = await getReloadlyProducts(1, 10);
  const products = Array.isArray(data) ? data : (data.content || []);

  if (!products.length) {
    return res.status(200).json({ success: true, message: 'No products found from Reloadly to sync.' });
  }

  const bulkOps = products.map((p: any) => ({
    updateOne: {
      filter: { reloadlyId: p.productId },
      update: {
        $set: {
          reloadlyId: p.productId,
          countryCode: p.country?.isoName || p.countryCode || 'US',
          name: p.productName || p.title || 'Unknown Product',
          denominationType: p.denominationType || 'FIXED',
          fixedDenominations: p.fixedAmounts || p.fixedDenominations || [],
          minAmount: p.minAmount || p.minDenomination || 0,
          maxAmount: p.maxAmount || p.maxDenomination || 0,
          exchangeRate: p.fixedRecipientToSenderExchangeRate || 1, // Default to 1 if missing
          isActive: true
        }
      },
      upsert: true
    }
  }));

  if (bulkOps.length > 0) {
    await GiftcardProductV2.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    message: `Successfully synced ${bulkOps.length} products from Reloadly.`
  });
});
