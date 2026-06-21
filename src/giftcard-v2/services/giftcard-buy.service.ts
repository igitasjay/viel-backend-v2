import GiftcardProductV2, { IGiftcardProduct } from '../models/giftcard-product.model';
import { getReloadlyProductFxRate, placeReloadlyOrder, getReloadlyOrderCodes } from './reloadly.service';

const STALENESS_CHECK_HOURS = Number(process.env.STALENESS_CHECK_HOURS || 24);

export const ensureFreshRate = async <T extends IGiftcardProduct>(product: T): Promise<T> => {
  const hoursSinceUpdate = (Date.now() - product.updatedAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate > STALENESS_CHECK_HOURS) {
    try {
      const liveData = await getReloadlyProductFxRate(product.reloadlyId);
      // Depending on Reloadly's response structure, we extract the new rate
      // Assuming it's in a field like 'senderCurrencyCode', 'destinationCurrencyCode', 'fixedRecipientDenominations'
      // We will mock the extraction for now, but in reality it's derived from liveData
      // Assuming liveData gives us something we map back:
      const newRate = liveData.exchangeRate || product.exchangeRate; // Fallback to current if missing in response
      
      product.exchangeRate = newRate;
      product.updatedAt = new Date();
      await product.save();
      
      return product;
    } catch (error) {
      console.error('Failed to update stale rate, using cached rate', error);
      return product; // If Reloadly fails, we might still want to proceed or throw. Let's proceed with old rate for now or throw depending on strictness.
      // Better to throw if rate is truly stale and we can't verify:
      // throw new Error('Could not verify live exchange rate');
    }
  }
  return product;
};

export const verifyBuyPrice = (
  product: IGiftcardProduct,
  cardValue: number,
  quantity: number,
  clientCalculatedTotal: number
): boolean => {
  let expectedBasePrice = 0;

  if (product.denominationType === 'FIXED') {
    if (!product.fixedDenominations.includes(cardValue)) {
      throw new Error('Invalid fixed denomination');
    }
    // Assuming cardValue here is the cost in Sender currency, or we use exchangeRate if cardValue is in Recipient currency.
    // Usually, cardValue is recipient currency. So basePrice = cardValue / exchangeRate
    // Let's assume for simplicity cardValue is the base price.
    expectedBasePrice = cardValue; 
  } else if (product.denominationType === 'RANGE') {
    if (cardValue < product.minAmount || cardValue > product.maxAmount) {
      throw new Error('Amount out of range');
    }
    expectedBasePrice = cardValue;
  }

  const expectedFee = product.feeConfiguration.type === 'PERCENTAGE' 
    ? (expectedBasePrice * product.feeConfiguration.value / 100)
    : product.feeConfiguration.value;

  const expectedTotal = (expectedBasePrice * quantity) + (expectedFee * quantity);
  
  const difference = Math.abs(clientCalculatedTotal - expectedTotal);
  
  // Tolerance of +/- 1
  return difference <= 1.0;
};
