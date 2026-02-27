// src/controllers/fiat/fiat.controller.ts
import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import CryptoAsset from '@/models/crypto.model';
import Transaction from '@/models/transaction.model';
import { fetchLiveRate } from '@/lib/twelve-data';
import { logger } from '@/lib/winston';
import { getNextSequence } from '@/lib/sequence';
// import { initializeTransaction, verifyTransaction } from '@/lib/paystack';
import config from '@/config/config';
import User from '@/models/user.model';
import { initMonnifyBankTransfer, initMonnifyTransaction } from '@/monnify-infra/services/monnify.service';

const buyValidation = [
  body('coin').trim().notEmpty().toUpperCase(),
  body('network').trim().notEmpty().toUpperCase(),
  body('amount').isFloat({ min: 0 }),
  // body('receiveAddress').trim().notEmpty(), // Made optional/checked manually
];

export const initializeBuyCrypto = [
  ...buyValidation,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ code: 'ValidationError', errors: errors.array() });
      return;
    }

    const { coin, network, amount: cryptoAmountStr, receiveAddress } = req.body;
    const cryptoAmount = parseFloat(cryptoAmountStr!);

    try {
      // Find asset & network
      const asset = await CryptoAsset.findOne({
        code: coin,
        status: 1,
        'networks.code': network,
        'networks.enabled': true,
      }).lean();

      if (!asset) {
        res.status(404).json({
          code: 'NotFound',
          message: 'Coin or network not supported.',
        });
        return;
      }

      const net = asset.networks.find((n: any) => n.code === network);
      if (!net) {
        res
          .status(404)
          .json({ code: 'NotFound', message: 'Network not enabled.' });
        return;
      }

      // Validate receive address
      const finalAddress = req.body.walletAddress || receiveAddress;
      if (!finalAddress) {
        res.status(400).json({
           code: 'ValidationError',
           message: 'walletAddress or receiveAddress is required'
        });
        return;
      }

      const addressRegex = new RegExp(net.addressRegex);
      if (!addressRegex.test(finalAddress)) {
        res.status(400).json({
          code: 'InvalidAddress',
          message: 'Invalid receive address format.',
        });
        return;
      }

      // Check minimum (reuse deposit min as buy min for simplicity)
      if (cryptoAmount < parseFloat(net.minimum)) {
        res.status(400).json({
          code: 'BelowMinimum',
          message: `Minimum buy amount: ${net.minimum} ${coin}`,
        });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
         res.status(404).json({ code: 'UserNotFound', message: 'User not found' });
         return;
      }

      // Live rate
      const live = await fetchLiveRate(asset.code);
      const rate = parseFloat(String(live?.ngn ?? asset.naira_rate));
      const nairaAmount = cryptoAmount * rate;

      // Generate reference (Monnify compliant if needed, or just unique)
      const reference = `buy_${req.userId}_${Date.now()}`;

      // Create transaction
      const txId = await getNextSequence('transactionId');
      const tx = await Transaction.create({
        id: txId,
        userId: req.userId,
        type: 'buy_crypto' as const,
        coin,
        network,
        crypto_amount: cryptoAmount.toFixed(asset.maximumDecimalPlaces),
        fiat_amount: nairaAmount.toFixed(2),
        receive_address: finalAddress,
        reference,
        status: 'pending',
        monnify_data: {
          initiation_source: 'frontend_bank_transfer',
        },
      });

      logger.info('Buy crypto transaction initialized (pending payment)', {
        txId,
        reference,
        nairaAmount,
      });

      // 1. Init Transaction to get Monnify Reference
      const initTxResponse = await initMonnifyTransaction({
        amount: nairaAmount,
        customerName: `${user.firstname} ${user.lastname}`,
        customerEmail: user.email,
        paymentReference: reference,
        paymentDescription: `Buy Crypto - ${reference}`,
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE!,
        redirectUrl: 'http://localhost:3000', 
        paymentMethods: ["ACCOUNT_TRANSFER"]
      });

      const monnifyRef = initTxResponse.responseBody.transactionReference;

      // Update transaction with Monnify reference
      tx.monnify_data = { ...tx.monnify_data, transactionReference: monnifyRef };
      await tx.save();

      // 2. Initialize Monnify Payment (Bank Transfer) using the Monnify Reference
      const monnifyResponse = await initMonnifyBankTransfer({
        transactionReference: monnifyRef,
        amount: nairaAmount,
        customerName: `${user.firstname} ${user.lastname}`,
        customerEmail: user.email,
        paymentDescription: `Buy Crypto - ${reference}`,
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE!,
      });

      res.status(201).json({
        message: 'Transaction initialized. Please proceed to payment.',
        data: {
          reference,
          naira_amount: nairaAmount.toFixed(2),
          transactionId: txId,
          paymentDetails: monnifyResponse.responseBody,
        },
      });
    } catch (error) {
      logger.error('Initialize buy failed:', error);
      res
        .status(500)
        .json({ code: 'ServerError', message: 'Initialization failed.' });
    }
  },
];

export const verifyPayment = [
  param('reference').trim().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    // This endpoint was for Paystack verification. 
    // For Monnify, we use a separate verification flow.
    // Leaving this here as legacy or placeholder if needed later.
    res.status(400).json({ message: 'Deprecated for Monnify flow. Use /transactions/:reference/verify' });
  },
];
