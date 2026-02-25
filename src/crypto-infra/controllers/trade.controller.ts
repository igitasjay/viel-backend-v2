import type { Request, Response } from 'express';
import { Currency } from '../models/currency.model';
// import { LedgerService } from '../services/ledger.service';
// import { LedgerType, LedgerCategory, TransactionAction } from '../models/Ledger';
import axios from 'axios';
import User from '@/models/user.model';
import Transaction from '@/models/transaction.model';
import { getNextSequence } from '@/lib/sequence';
import { logger } from '@/lib/winston';
import { initMonnifyBankTransfer, initMonnifyTransaction } from '@/services/monnify.service';


/**
 * GET /rates
 */
export const getRates = async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find({ isActive: true });
    const rates = [];

    for (const coin of currencies) {
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

    const buyRate = coin.buyRate;
    const minLimit = coin.minimum || 0;

    const cryptoAmount = Number(amount);

    // 2. Enforce Minimum Buy Limit
    if (cryptoAmount < minLimit) {
        return res.status(400).json({ 
            message: `Minimum purchase amount is ${minLimit} ${symbol}` 
        });
    }
    const nairaAmount = cryptoAmount * buyRate; 
    
    if (isNaN(nairaAmount)) {
         return res.status(400).json({ message: 'Calculated NGN amount is invalid' }); 
    } 

    // 2. Create Transaction (Pending)
    const txId = await getNextSequence('transactionId');
    const reference = `buy_${req.userId}_${Date.now()}`;
    
    // Note: 'Transaction' model is imported from global models
    const tx = await Transaction.create({
        id: txId,
        userId: user._id,
        type: 'buy_crypto',
        coin: symbol,
        network: network || 'Default', // Fallback if network not in Currency model yet
        crypto_amount: cryptoAmount.toFixed(8),
        fiat_amount: nairaAmount.toFixed(2),
        receive_address: walletAddress,
        reference,
        status: 'pending',
        monnify_data: {
          initiation_source: 'frontend_bank_transfer',
        },
        image: coin.imageUrl,
    });

    logger.info('Buy crypto transaction initialized (pending payment)', {
          nairaAmount,
    });

    // 3. Init Monnify Flow
    // Step A: Init Transaction
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

    // Step B: Init Bank Transfer
    const monnifyResponse = await initMonnifyBankTransfer({
      transactionReference: monnifyRef,
      amount: nairaAmount,
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
            naira_amount: nairaAmount.toFixed(2),
            transactionId: txId,
            paymentDetails: monnifyResponse.responseBody,
        }
    });

  } catch (error: any) {
    logger.error('Buy Crypto Init Failed:', error);
    return res.status(500).json({ error: error.message });
  }
};
