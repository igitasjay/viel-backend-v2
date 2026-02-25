import GiftCard from '../models/giftcard.model';
import GiftCardPurchase from '@/models/giftcard-purchase.model';
import { ApiError } from '@/utils/api-error.util';
import mongoose from 'mongoose';
import { LedgerService } from '@/crypto-infra/services/ledger.service';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '@/crypto-infra/models/ledger.model';

export const createGiftCard = (payload: any) => {
  console.log('payload →', {
    minAmount: typeof payload.minAmount,
    maxAmount: typeof payload.maxAmount,
    availableQty: typeof payload.availableQty,
    rate: typeof payload.rate,
  });
  return GiftCard.create(payload);
};

export const updateGiftCard = (id: string, payload: any) =>
  GiftCard.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
export const getGiftCardsByCountry = (country: string) =>
  GiftCard.find({ country, isAvailable: true });
export const getGiftCardById = (id: string) => GiftCard.findById(id);

// Purchase function: uses transaction to ensure stock consistency
export const purchaseGiftCard = async (
  userId: string,
  fullName: string,
  userEmail: string,
  giftCardId: string,
  amount: number,
  quantity: number,
  email: string, // This is the 'sendEmailTo' field
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const card = await GiftCard.findById(giftCardId).session(session);
    if (!card) throw new ApiError(404, 'Gift card not found');
    if (!card.isAvailable) throw new ApiError(400, 'Gift card unavailable');

    // Amount validation
    if (card.minAmount > 0 && amount < card.minAmount)
      throw new ApiError(400, `Amount cannot be below ${card.minAmount}`);
    if (card.maxAmount > 0 && amount > card.maxAmount)
      throw new ApiError(400, `Amount cannot exceed ${card.maxAmount}`);
    if (!card.validAmounts.includes(amount))
      throw new ApiError(400, `Invalid amount for this gift card`);

    // Quantity validation
    if (quantity < 1) throw new ApiError(400, `Quantity must be >= 1`);
    if (quantity > card.availableQty)
      throw new ApiError(
        400,
        `Requested quantity (${quantity}) exceeds available stock (${card.availableQty})`,
      );

    const totalInNaira = amount * quantity * card.rate;

    // Create purchase snapshot
    const purchase = await GiftCardPurchase.create(
      [
        {
          userId,
          fullName,
          userEmail,
          giftCardId,
          amount,
          quantity,
          totalInNaira,
          sendEmailTo: email,
          status: 'pending',
          detailsSnapshot: {
            brandName: card.name,
            country: card.country,
            instruction: card.instruction,
            rate: card.rate,
            image: card.imageUrl,
            currency: card.currency,
          },
        },
      ],
      { session },
    );

    // 2. Log to Ledger (Debit Naira)
    await LedgerService.creditUser(
      userId,
      'NGN',
      -totalInNaira,
      LedgerType.GIFTCARD_BUY,
      `GCP-${purchase[0]._id}`,
      LedgerCategory.GIFTCARD,
      TransactionAction.BUY,
      card.imageUrl,
    );

    // decrement stock atomically
    card.availableQty -= quantity;
    if (card.availableQty <= 0) {
      card.availableQty = 0; // Guard against negative stock
      card.isAvailable = false;
    }
    await card.save({ session });

    await session.commitTransaction();
    session.endSession();

    return purchase[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
