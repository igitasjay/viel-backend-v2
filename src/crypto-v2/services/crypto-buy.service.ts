import mongoose from 'mongoose';
import crypto from 'crypto';
import { QuoteModel } from '../models/quote.model';
import { WhitelistModel } from '../models/whitelist.model';
import { Currency } from '@/crypto-infra/models/currency.model';
import AppSettingModel from '@/models/app-setting.model';
import TransactionModel, { ITransaction } from '@/models/transaction.model';
import User from '@/models/user.model';
import { ObiexService } from './obiex.service';
import { GetQuoteDto, ExecuteBuyDto } from '../types/crypto.dto';
import { initMonnifyTransaction, initMonnifyBankTransfer } from '@/monnify-infra/services/monnify.service';
import config from '@/config/config';
import Decimal from 'decimal.js';

export class CryptoBuyService {
  static async getQuote(userId: string, params: GetQuoteDto) {
    const { coin, chain, amountNGN } = params;

    const currencyConfig = await Currency.findOne({ symbol: coin, network: chain, isActive: true });
    if (!currencyConfig) {
      throw new Error(`Unsupported or inactive currency/chain: ${coin}-${chain}`);
    }

    if (!currencyConfig.sellRate || currencyConfig.sellRate <= 0) {
      throw new Error(`Sell rate not configured for ${coin}`);
    }

    const sellRate = currencyConfig.sellRate;
    const usdValue = amountNGN / sellRate;

    // Get exact crypto amount via external service
    let cryptoAmount = 0;
    if (currencyConfig.is_stable) {
      cryptoAmount = usdValue;
    } else {
      const quote = await ObiexService.getTradeQuote({
        sourceId: 'USDT',
        targetId: coin,
        amount: usdValue,
        side: 'BUY',
      });
      cryptoAmount = Number(quote.amountReceived);
    }

    if (cryptoAmount <= 0) {
      throw new Error('Failed to fetch valid quote');
    }

    const quoteId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const quote = await QuoteModel.create({
      userId,
      quoteId,
      coin,
      chain,
      amountNGN,
      cryptoAmount,
      rate: sellRate,
      expiresAt,
      status: 'pending',
    });

    return {
      quoteId: quote.quoteId,
      coin: quote.coin,
      chain: quote.chain,
      amountNGN: quote.amountNGN,
      cryptoAmount: quote.cryptoAmount,
      rate: quote.rate,
      expiresAt: quote.expiresAt,
    };
  }

  static async executeBuy(userId: string, params: ExecuteBuyDto) {
    const { quoteId, destinationAddress } = params;

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const quote = await QuoteModel.findOne({ quoteId, userId, status: 'pending' });
    if (!quote) throw new Error('Quote not found or already executed');
    if (new Date() > quote.expiresAt) {
      quote.status = 'expired';
      await quote.save();
      throw new Error('Quote has expired. Please request a new quote.');
    }

    // Verify whitelist
    const isWhitelisted = await WhitelistModel.exists({
      userId,
      coin: quote.coin,
      chain: quote.chain,
      address: destinationAddress,
      isApproved: true,
    });

    if (!isWhitelisted) {
      throw new Error('Destination address is not whitelisted for this coin/chain');
    }

    const referenceId = `BUY-${crypto.randomUUID()}`;

    // Initialize Monnify Transaction
    const initTxResponse = await initMonnifyTransaction({
      amount: quote.amountNGN,
      customerName: `${user.firstname} ${user.lastname}`.trim() || 'User',
      customerEmail: user.email,
      paymentReference: referenceId,
      paymentDescription: `Crypto Purchase - ${quote.cryptoAmount} ${quote.coin}`,
      currencyCode: 'NGN',
      contractCode: config.MONNIFY_CONTRACT_CODE!,
      redirectUrl: 'https://MyViel.com', // Optional redirect
      paymentMethods: ['ACCOUNT_TRANSFER'],
    });

    const monnifyRef = initTxResponse.responseBody.transactionReference;

    // Initialize Monnify Bank Transfer
    const monnifyResponse = await initMonnifyBankTransfer({
      transactionReference: monnifyRef,
      bankCode: '035', // Assuming Wema Bank, can be dynamic
      amount: quote.amountNGN,
      customerName: `${user.firstname} ${user.lastname}`.trim() || 'User',
      customerEmail: user.email,
      paymentDescription: `Crypto Purchase - ${quote.cryptoAmount} ${quote.coin}`,
      currencyCode: 'NGN',
      contractCode: config.MONNIFY_CONTRACT_CODE!,
    });

    // Mark quote as executed
    quote.status = 'executed';
    await quote.save();

    // Check App Settings for threshold
    const settings = await AppSettingModel.findOne();
    const adminThreshold = settings?.cryptoBuyAdminApprovalThreshold || 1000000;
    const needsAdminApproval = quote.amountNGN > adminThreshold;

    // Create Transaction record as initialized
    const tx = await TransactionModel.create({
      id: Math.floor(Math.random() * 1000000000), // Random int ID
      userId,
      type: 'buy_crypto',
      coin: quote.coin,
      network: quote.chain,
      crypto_amount: quote.cryptoAmount.toString(),
      fiat_amount: quote.amountNGN.toString(),
      receive_address: destinationAddress,
      reference: referenceId, // Paystack/Monnify payment reference
      status: 'initialized',
      monnify_data: {
        transactionReference: monnifyRef,
        paymentDetails: monnifyResponse.responseBody,
      },
      metadata: {
        needsAdminApproval,
      },
    });

    return {
      transactionId: tx.id,
      reference: tx.reference,
      paymentDetails: monnifyResponse.responseBody,
      message: 'Payment initialized. Please transfer to the provided account.',
    };
  }

  /**
   * Called by the webhook controller when a successful payment is detected.
   */
  static async handleMonnifyPaymentSuccess(tx: ITransaction) {
    if (tx.status !== 'processing') {
      console.warn(`handleMonnifyPaymentSuccess called but tx ${tx.id} is not processing`);
      return;
    }

    const needsAdminApproval = tx.metadata?.needsAdminApproval === true;

    if (needsAdminApproval) {
      // Keep it as 'paid' or 'pending' for admin
      tx.status = 'paid';
      await tx.save();
      console.log(`Crypto buy ${tx.id} requires admin approval.`);
      return;
    }

    // Process Withdrawal to Obiex
    try {
      await ObiexService.createWithdrawal({
        currency: tx.coin as string,
        network: tx.network as string,
        amount: parseFloat(tx.crypto_amount as string),
        address: tx.receive_address as string,
      });

      tx.status = 'completed';
      await tx.save();

      // Update User volumes
      const user = await User.findById(tx.userId);
      if (user) {
        const fiatAmt = new Decimal(tx.fiat_amount || '0');
        const netVol = new Decimal(user.netTradingVolumn || '0').plus(fiatAmt);
        const buyVol = new Decimal(user.totalBuyVolume || '0').plus(fiatAmt);

        user.netTradingVolumn = netVol.toString();
        user.totalBuyVolume = buyVol.toString();
        await user.save();
      }

    } catch (withdrawalError) {
      tx.status = 'failed';
      await tx.save();
      console.error(`Withdrawal failed for tx ${tx.id}`, withdrawalError);
    }
  }

  static async addWhitelist(userId: string, data: any) {
    return WhitelistModel.create({
      userId,
      ...data,
      isApproved: true,
    });
  }

  static async getWhitelist(userId: string) {
    return WhitelistModel.find({ userId });
  }
}
