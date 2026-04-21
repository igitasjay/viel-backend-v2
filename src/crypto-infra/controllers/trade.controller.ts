import type { Request, Response } from 'express';
import { Currency } from '../models/currency.model';
import { LedgerService } from '../services/ledger.service';
import { LedgerType, LedgerCategory, TransactionAction, SystemAccount } from '../models/ledger.model';
import axios from 'axios';
import User from '@/models/user.model';
import Transaction from '@/models/transaction.model';
import { getNextSequence } from '@/lib/sequence';
import { logger } from '@/lib/winston';
import { initMonnifyBankTransfer, initMonnifyTransaction } from '@/monnify-infra/services/monnify.service';
import { UserService, VolumeType } from '@/services/user.service';
import config from '@/config/config';
import mongoose from 'mongoose';
import * as Decimal from '@/utils/decimal.util';


/**
 * GET /rates
 */
export const getRates = async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find({ isActive: true });
    const rates = [];

    for (const coin of currencies) {
      if (!config.SHOW_TEST_ASSETS && coin.symbol.startsWith('TEST_')) continue;
      rates.push({
        pair: `${coin.symbol}/NGN`,
        buy: coin.buyRate,
        sell: coin.sellRate,
      });
    }

    return res.json({ success: true, data: rates });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /trade/buy (Fiat -> Crypto)
 */
export const buyCrypto = async (req: Request, res: Response) => {
  try {
    const { amount, symbol, network, walletAddress } = req.body;
    const userId = req.userId?.toString();

    if (!amount || isNaN(Number(amount))) {
        return res.status(400).json({ message: 'Invalid or missing amount' });
    }
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });
    if (!walletAddress) return res.status(400).json({ message: 'Wallet address is required' });

    if (!process.env.MONNIFY_CONTRACT_CODE) {
        logger.error('MONNIFY_CONTRACT_CODE is not defined');
        return res.status(500).json({ message: 'Server configuration error' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // 1. Get Rate & Coin validation
    const coin = await Currency.findOne({ symbol });
    if (!coin) throw new Error('Invalid Coin: ' + symbol);

    const buyRateStr = String(coin.buyRate);
    const minLimit = coin.minimum || 0;

    const cryptoAmountStr = String(amount);

    // 2. Enforce Minimum Buy Limit
    if (parseFloat(cryptoAmountStr) < minLimit) {
        return res.status(400).json({ 
            message: `Minimum purchase amount is ${minLimit} ${symbol}` 
        });
    }

    // Use Decimal for rate multiplication
    const nairaAmountStr = Decimal.mul(cryptoAmountStr, buyRateStr);
    
    if (Decimal.isNegative(nairaAmountStr) || Decimal.isZero(nairaAmountStr)) {
         return res.status(400).json({ message: 'Calculated NGN amount is invalid' }); 
    } 

    // 2. Create Transaction (Pending)
    const txId = await getNextSequence('transactionId');
    const isTest = symbol.startsWith('TEST_');
    const reference = `${isTest ? 'TEST_' : ''}buy_${req.userId}_${Date.now()}`;
    
    // Note: 'Transaction' model is imported from global models
    const tx = await Transaction.create({
        id: txId,
        userId: user._id,
        type: 'buy_crypto',
        coin: symbol,
        network: network || 'Default', // Fallback if network not in Currency model yet
        crypto_amount: Decimal.format(cryptoAmountStr, 8),
        fiat_amount: Decimal.format(nairaAmountStr, 2),
        receive_address: walletAddress,
        reference,
        status: 'pending',
        monnify_data: {
          initiation_source: 'frontend_bank_transfer',
        },
        image: coin.imageUrl,
    });

    const nairaAmountNum = parseFloat(nairaAmountStr);

    logger.info('Buy crypto transaction initialized (pending payment)', {
          nairaAmount: nairaAmountStr,
    });

    // 3. Init Monnify Flow
    // Step A: Init Transaction
    const initTxResponse = await initMonnifyTransaction({
      amount: nairaAmountNum,
      customerName: `${user.firstname} ${user.lastname}`,
      customerEmail: user.email,
      paymentReference: reference,
      paymentDescription: `Buy Crypto - ${reference}`,
      currencyCode: 'NGN',
      contractCode: process.env.MONNIFY_CONTRACT_CODE!,
      redirectUrl: config.FRONTEND_URL!, 
      paymentMethods: ["ACCOUNT_TRANSFER"]
    });

    const monnifyRef = initTxResponse.responseBody.transactionReference;

    // Step B: Init Bank Transfer
    const monnifyResponse = await initMonnifyBankTransfer({
      transactionReference: monnifyRef,
      amount: nairaAmountNum,
      customerName: `${user.firstname} ${user.lastname}`,
      customerEmail: user.email,
      paymentDescription: `Buy Crypto - ${reference}`,
      currencyCode: 'NGN',
      contractCode: process.env.MONNIFY_CONTRACT_CODE!,
    });

    return res.status(201).json({ 
        success: true, 
        message: 'Transaction initialized. Please proceed to payment.',
        data: {
            reference,
            naira_amount: Decimal.format(nairaAmountStr, 2),
            transactionId: txId,
            paymentDetails: monnifyResponse.responseBody,
        }
    });

  } catch (error: any) {
    logger.error('Buy Crypto Init Failed:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Shared fulfillment function for buy crypto
 * Called after successful payment (webhook or manual verification)
 * Now wrapped in a single Mongo session for atomicity.
 */
export const fulfillBuyCrypto = async (transaction: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = transaction.userId.toString();
        const fiatAmountStr = String(transaction.fiat_amount || '0');
        
        // 1. Update User Trading Volume (inside session)
        if (transaction.fiat_amount) {
            await UserService.updateUserVolume(
                userId,
                fiatAmountStr,
                VolumeType.BUY,
                session,
            );
        }

        // 2. Create Ledger Entry — double-entry (inside session)
        await LedgerService.recordEntry({
            userId,
            asset: `${transaction.coin} (${transaction.network})`,
            amount: fiatAmountStr,
            type: LedgerType.TRADE_BUY,
            refId: `BUY-${transaction.id}-${transaction.reference}`,
            category: LedgerCategory.CRYPTO,
            action: TransactionAction.BUY,
            counterparty: SystemAccount.INVENTORY,
            image: transaction.image,
            status: 'completed',
            tradedAsset: 'NGN',
            affectsBalance: false,
            session,
        });

        // 3. Update Transaction Status (inside session)
        transaction.status = 'completed';
        await transaction.save({ session });

        await session.commitTransaction();
        logger.info(`Buy Crypto Fulfillment Successful for TX ${transaction.id}`);
        return true;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Buy Crypto Fulfillment Failed for TX ${transaction.id}:`, error);
        throw error;
    } finally {
        session.endSession();
    }
};
