import mongoose from 'mongoose';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import { CryptoWalletModel } from '../models/crypto-wallet.model';
import { ObiexService } from './obiex.service';
import { GenerateWalletDto, WebhookPayloadDto } from '../types/crypto.dto';
import TransactionModel from '@/models/transaction.model';
import { Currency } from '@/crypto-infra/models/currency.model';
import User from '@/models/user.model';
import BankAccount from '@/models/bank.model';
import { disburseFunds } from '@/monnify-infra/services/monnify.service';

export class CryptoSellService {
  static async generateWallet(userId: string, params: GenerateWalletDto) {
    const { coin, chain } = params;

    // Verify Bank Account
    const bankAccount = await BankAccount.findOne({ userId });
    if (!bankAccount) {
      throw new Error('A linked bank account is required to generate a deposit address.');
    }

    // Check if wallet exists
    const existing = await CryptoWalletModel.findOne({ userId, asset: coin, chain });
    if (existing) return existing;

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const uniqueUserIdentifier = user.id.toString();

    // Fetch from Obiex
    const response = await ObiexService.createBrokerAddress({
      uniqueUserIdentifier,
      currency: coin,
      network: chain,
    });

    const address = response.data?.value || response.address;

    if (!address) {
      throw new Error('Failed to generate wallet address from broker');
    }

    const wallet = await CryptoWalletModel.create({
      userId,
      asset: coin,
      chain,
      address,
      provider: 'OBIEX',
      qrCode: `ethereum:${address}`,
    });

    return wallet;
  }

  static async getWallets(userId: string) {
    return CryptoWalletModel.find({ userId });
  }

  static async handleWebhook(payload: WebhookPayloadDto) {
    const { type, currency, amount, status, hash, network, address } = payload;

    if (type !== 'DEPOSIT') return;

    const wallet = await CryptoWalletModel.findOne({
      address: { $regex: new RegExp(`^${address}$`, 'i') },
      asset: currency,
    });

    if (!wallet) return;

    const currencyConfig = await Currency.findOne({ symbol: currency, network, isActive: true });
    if (!currencyConfig || !currencyConfig.buyRate) return;

    // Convert crypto -> USD -> NGN
    const usdValue = currencyConfig.is_stable
      ? amount
      : (await ObiexService.getTradeQuote({ sourceId: currency, targetId: 'USDT', amount, side: 'SELL' })).amountReceived;
    
    const amountNGN = usdValue * currencyConfig.buyRate;

    if (status === 'PENDING') {
      const existing = await TransactionModel.findOne({ reference: `SELL-${hash}` });
      if (existing) return;

      await TransactionModel.create({
        id: Math.floor(Math.random() * 1000000000),
        userId: wallet.userId,
        type: 'deposit_crypto',
        coin: currency,
        network,
        crypto_amount: amount.toString(),
        fiat_amount: amountNGN.toString(),
        receive_address: address,
        reference: `SELL-${hash}`,
        status: 'pending',
      });
    } else if (status === 'CONFIRMED') {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const tx = await TransactionModel.findOne({ reference: `SELL-${hash}` }).session(session);
        
        if (tx && tx.status === 'completed') {
          await session.abortTransaction();
          return;
        }

        let currentTx = tx;
        if (currentTx) {
          currentTx.status = 'processing';
          await currentTx.save({ session });
        } else {
          const [newTx] = await TransactionModel.create(
            [
              {
                id: Math.floor(Math.random() * 1000000000),
                userId: wallet.userId,
                type: 'deposit_crypto',
                coin: currency,
                network,
                crypto_amount: amount.toString(),
                fiat_amount: amountNGN.toString(),
                receive_address: address,
                reference: `SELL-${hash}`,
                status: 'processing',
              },
            ],
            { session }
          );
          currentTx = newTx;
        }

        const bankAccount = await BankAccount.findOne({ userId: wallet.userId }).session(session);
        if (!bankAccount) {
          throw new Error(`Bank account missing for user ${wallet.userId}`);
        }

        await session.commitTransaction();

        // Disbursement to user's bank
        try {
          await disburseFunds({
            amount: amountNGN,
            reference: `DISB-${hash}`,
            narration: `Crypto Sell Payout - ${amount} ${currency}`,
            destinationBankCode: bankAccount.bankCode,
            destinationAccountNumber: bankAccount.accountNumber,
            currency: 'NGN',
          });

          currentTx.status = 'completed';
          await currentTx.save();

          // Update user volume
          const user = await User.findById(wallet.userId);
          if (user) {
            const fiatAmt = new Decimal(amountNGN);
            const netVol = new Decimal(user.netTradingVolumn || '0').plus(fiatAmt);
            const sellVol = new Decimal(user.totalSellVolume || '0').plus(fiatAmt);
            
            user.netTradingVolumn = netVol.toString();
            user.totalSellVolume = sellVol.toString();
            await user.save();
          }

        } catch (disbursementError) {
          console.error(`Monnify disbursement failed for TX ${currentTx.id}`, disbursementError);
          currentTx.status = 'failed';
          await currentTx.save();
        }

      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  }
}
