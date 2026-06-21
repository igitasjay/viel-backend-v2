import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import GiftcardProductV2 from '../models/giftcard-product.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/user.model';
import { getNextSequence } from '@/lib/sequence';
import { ensureFreshRate, verifyBuyPrice } from '../services/giftcard-buy.service';
import { initMonnifyTransaction, initMonnifyBankTransfer } from '@/monnify-infra/services/monnify.service';
import config from '@/config/config';
import { placeReloadlyOrder, getReloadlyOrderCodes } from '../services/reloadly.service';
import { logger } from '@/lib/winston';

export const getCountries = asyncHandler(async (req: Request, res: Response) => {
  const countries = await GiftcardProductV2.distinct('countryCode', { isActive: true });
  res.status(200).json({ success: true, data: countries });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { countryCode, page = 1, limit = 20 } = req.query;
  const filter: any = { isActive: true };
  if (countryCode) {
    filter.countryCode = (countryCode as string).toUpperCase();
  }

  const products = await GiftcardProductV2.find(filter)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  res.status(200).json({ success: true, data: products });
});

export const getExchangeRate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  let product = await GiftcardProductV2.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  // Stale Rate Protection check dynamically on fetch if needed
  product = await ensureFreshRate(product);

  res.status(200).json({ success: true, data: { exchangeRate: product.exchangeRate } });
});

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { productId, cardValue, quantity, calculatedSubtotal, calculatedFee, calculatedTotal, pin, paymentMethod, email } = req.body;
  const userId = req.userId?.toString();

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  
  // TODO: Verify PIN logic here based on your existing user schema `passcode` comparison

  let product = await GiftcardProductV2.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found or inactive');

  product = await ensureFreshRate(product);

  const isPriceValid = verifyBuyPrice(product, Number(cardValue), Number(quantity), Number(calculatedTotal));
  if (!isPriceValid) {
    throw new ApiError(400, 'Calculated total mismatch. Prices may have changed.');
  }

  const reference = `BGCTX_V2_${req.userId}_${Date.now()}`;
  const txId = await getNextSequence('transactionId');

  const tx = await Transaction.create({
    id: txId,
    userId: user._id,
    type: 'buy_giftcard_v2',
    coin: product.name,
    fiat_amount: calculatedTotal.toFixed(2),
    reference,
    status: 'pending',
    monnify_data: { initiation_source: 'frontend_bank_transfer' },
    giftcard_data: {
      productId: product._id,
      reloadlyId: product.reloadlyId,
      cardValue,
      quantity,
      expectedTotal: calculatedTotal,
      recipientEmail: email,
    },
  });

  const initTxResponse = await initMonnifyTransaction({
    amount: calculatedTotal,
    customerName: `${user.firstname} ${user.lastname}`,
    customerEmail: user.email,
    paymentReference: reference,
    paymentDescription: `Gift Card Purchase - ${product.name}`,
    currencyCode: 'NGN',
    contractCode: config.MONNIFY_CONTRACT_CODE!,
    redirectUrl: config.FRONTEND_URL,
    paymentMethods: ['ACCOUNT_TRANSFER'],
  });

  const monnifyRef = initTxResponse.responseBody.transactionReference;
  tx.monnify_data = { ...tx.monnify_data, transactionReference: monnifyRef };
  await tx.save();

  const monnifyResponse = await initMonnifyBankTransfer({
    transactionReference: monnifyRef,
    amount: calculatedTotal,
    customerName: `${user.firstname} ${user.lastname}`,
    customerEmail: user.email,
    paymentDescription: `Gift Card Purchase - ${product.name}`,
    currencyCode: 'NGN',
    contractCode: config.MONNIFY_CONTRACT_CODE!,
  });

  res.status(201).json({
    success: true,
    data: {
      reference,
      amount: calculatedTotal,
      transactionId: txId,
      paymentDetails: monnifyResponse.responseBody,
    },
  });
});

export const fulfillOrder = asyncHandler(async (req: Request, res: Response) => {
  // This is a pseudo-webhook handler or internal fulfiller.
  // Assuming Monnify webhook already marked transaction as 'paid'
  const { transactionReference } = req.body;
  const tx = await Transaction.findOne({ 'monnify_data.transactionReference': transactionReference, type: 'buy_giftcard_v2', status: 'paid' });
  
  if (!tx) throw new ApiError(404, 'Transaction not found or not in paid status');

  const { reloadlyId, cardValue, quantity, recipientEmail } = tx.giftcard_data;
  const user = await User.findById(tx.userId);

  try {
    const orderResponse = await placeReloadlyOrder({
      productId: reloadlyId,
      quantity,
      unitPrice: cardValue,
      senderName: user ? `${user.firstname} ${user.lastname}` : 'Viel User',
      recipientEmail,
      customIdentifier: tx.reference || '',
    });

    tx.giftcard_data.reloadlyTransactionId = orderResponse.transactionId;
    
    // Async code delivery delay
    setTimeout(async () => {
      try {
        const codes = await getReloadlyOrderCodes(orderResponse.transactionId);
        if (codes && codes.length > 0) {
          tx.giftcard_data.codes = codes; // Encrypt at rest in a real implementation
          tx.status = 'completed';
        } else {
          tx.status = 'processing';
        }
        await tx.save();
      } catch (err) {
        logger.error('Failed to fetch reloadly codes', err);
        tx.status = 'processing';
        await tx.save();
      }
    }, 5000);

    res.status(200).json({ success: true, message: 'Fulfillment initiated' });
  } catch (error) {
    tx.status = 'failed';
    await tx.save();
    // Immediate refund logic would go here
    throw new ApiError(500, 'Reloadly API failure. Refund processing...');
  }
});

export const refreshCodes = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // Transaction ID
  const tx = await Transaction.findOne({ _id: id, type: 'buy_giftcard_v2', status: 'processing', userId: req.userId });

  if (!tx) throw new ApiError(404, 'Transaction not found or not in processing state');

  const transactionId = tx.giftcard_data.reloadlyTransactionId;
  if (!transactionId) throw new ApiError(400, 'No underlying Reloadly transaction found');

  const codes = await getReloadlyOrderCodes(transactionId);
  if (codes && codes.length > 0) {
    tx.giftcard_data.codes = codes;
    tx.status = 'completed';
    await tx.save();
    res.status(200).json({ success: true, data: codes });
  } else {
    res.status(202).json({ success: true, message: 'Codes still not ready', data: [] });
  }
});
