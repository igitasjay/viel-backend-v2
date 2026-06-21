import AcceptedGiftCardV2 from '../models/accepted-giftcard.model';
import { normalizeRange, normalizeReceiptType } from '../utils/string.util';

export const getRateForSell = async (
  brandName: string,
  countryCode: string,
  rangeStr: string,
  receiptTypeStr: string
): Promise<number> => {
  const normalizedRange = normalizeRange(rangeStr);
  const normalizedReceiptType = normalizeReceiptType(receiptTypeStr);

  const card = await AcceptedGiftCardV2.findOne({ brandName, countryCode, isActive: true });
  
  if (!card) {
    throw new Error('Accepted gift card not found or inactive');
  }

  if (!card.rates || !card.rates[normalizedRange] || card.rates[normalizedRange][normalizedReceiptType] === undefined) {
    throw new Error('Rate not found for the specified range and receipt type');
  }

  return card.rates[normalizedRange][normalizedReceiptType];
};

export const verifySellPayout = (
  cardValue: number,
  quantity: number,
  buyingRate: number,
  promoDiscount: number = 0,
  clientCalculatedPayout: number
): boolean => {
  const expectedPayout = (cardValue * quantity * buyingRate) + promoDiscount;
  
  const difference = Math.abs(clientCalculatedPayout - expectedPayout);
  
  // Tolerance of +/- 1
  return difference <= 1.0;
};
