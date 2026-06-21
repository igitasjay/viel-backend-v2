import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import AcceptedGiftCardV2 from '../models/accepted-giftcard.model';
import GiftcardSaleV2 from '../models/giftcard-sale.model';
import Transaction from '@/models/transaction.model';
import { getNextSequence } from '@/lib/sequence';
import { getRateForSell, verifySellPayout } from '../services/giftcard-sell.service';

export const getAcceptedCards = asyncHandler(async (req: Request, res: Response) => {
  const cards = await AcceptedGiftCardV2.find({ isActive: true });
  res.status(200).json({ success: true, data: cards });
});

export const calculatePayout = asyncHandler(async (req: Request, res: Response) => {
  const { brandName, countryCode, cardRange, receiptType, cardValue, quantity, promoDiscount = 0 } = req.body;

  const buyingRate = await getRateForSell(brandName, countryCode, cardRange, receiptType);
  const expectedPayout = (Number(cardValue) * Number(quantity) * buyingRate) + Number(promoDiscount);

  res.status(200).json({ success: true, data: { expectedPayout, buyingRate } });
});

export const submitSale = asyncHandler(async (req: Request, res: Response) => {
  const { brandName, countryCode, cardRange, receiptType, cardValue, quantity, calculatedPayout, promoCode, cardCode, cardPin } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one proof image is required');
  }

  const buyingRate = await getRateForSell(brandName, countryCode, cardRange, receiptType);
  
  const isPayoutValid = verifySellPayout(Number(cardValue), Number(quantity), buyingRate, 0, Number(calculatedPayout));
  if (!isPayoutValid) {
    throw new ApiError(400, 'Calculated payout mismatch');
  }

  const imageUrls = files.map((file) => file.path); // Assuming multer-storage-cloudinary places the Cloudinary URL in `path`
  
  const cardObj = await AcceptedGiftCardV2.findOne({ brandName, countryCode, isActive: true });

  const sale = await GiftcardSaleV2.create({
    userId: req.userId,
    acceptedCardId: cardObj!._id,
    brandName,
    cardRange,
    receiptType,
    cardValue: Number(cardValue),
    quantity: Number(quantity),
    rateApplied: buyingRate,
    expectedPayout: Number(calculatedPayout),
    images: imageUrls,
    promoCode,
    cardCode,
    cardPin,
    status: 'SUBMITTED',
  });

  const txId = await getNextSequence('transactionId');
  const tx = await Transaction.create({
    id: txId,
    userId: req.userId,
    type: 'sell_giftcard_v2',
    fiat_amount: calculatedPayout.toString(),
    status: 'pending',
    giftcard_data: {
      saleId: sale._id,
      brandName,
      expectedPayout: calculatedPayout,
      images: imageUrls,
    },
    image: imageUrls[0],
  });

  // TODO: Trigger Notification to Admin queue via NotificationService or similar

  res.status(201).json({
    success: true,
    message: 'Sale submitted successfully for admin review',
    data: { saleId: sale._id, transactionId: tx._id }
  });
});
