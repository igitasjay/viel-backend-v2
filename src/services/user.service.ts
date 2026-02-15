import User from '@/models/user.model';
import mongoose from 'mongoose';
import AppSetting from '@/models/app-setting.model';
import BankAccount from '@/models/bank.model';
import { disburseFunds } from './monnify.service';
import { Ledger } from '@/crypto-infra/models/Ledger';
import { logger } from '@/lib/winston';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '@/crypto-infra/models/Ledger';

export enum VolumeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class UserService {
  /**
   * Update user trading volume atomically
   */
  static async updateUserVolume(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    type: VolumeType,
    session?: mongoose.ClientSession
  ) {
    const user = await User.findById(userId).session(session || null);
    if (!user) return null;

    const isFirstTransaction = user.netTradingVolumn === 0;

    const update: any = {
      $inc: {
        netTradingVolumn: Number(amount),
      },
    };

    if (type === VolumeType.BUY) {
      update.$inc.totalBuyVolume = Number(amount);
    } else {
      update.$inc.totalSellVolume = Number(amount);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      update,
      { session, new: true }
    );

    // Referral Reward Logic
    if (isFirstTransaction && user.referredBy) {
      this.triggerReferralReward(user.referredBy, user._id.toString()).catch(err => {
        logger.error('Failed to trigger referral reward', { userId, referrerId: user.referredBy, error: err });
      });
    }

    return updatedUser;
  }

  private static async triggerReferralReward(referrerId: string, referredUserId: string) {
    try {
      const settings = await AppSetting.findOne().exec();
      const rewardAmount = settings?.referralRewardAmount || 0;

      if (rewardAmount <= 0) return;

      const referrerBank = await BankAccount.findOne({ userId: referrerId }).exec();
      if (!referrerBank) {
        logger.warn(`Referrer ${referrerId} has no bank account. Reward ${rewardAmount} not disbursed.`);
        return;
      }

      const reference = `ref_reward_${referredUserId}_${Date.now()}`;
      
      // Automatic Payout via Monnify
      await disburseFunds({
        amount: rewardAmount,
        reference,
        narration: `Referral reward for referring user ${referredUserId}`,
        destinationBankCode: referrerBank.bankCode,
        destinationAccountNumber: referrerBank.accountNumber,
        currency: 'NGN',
      });

      // Record in Ledger
      await Ledger.create({
        userId: new mongoose.Types.ObjectId(referrerId),
        asset: 'NGN',
        amount: rewardAmount,
        type: LedgerType.GIFTCARD_SELL, // Reusing existing type or we should have added REFERRAL_REWARD
        transactionCategory: LedgerCategory.GIFTCARD,
        transactionType: TransactionAction.SELL,
        referenceId: reference,
        description: `Referral reward for user ${referredUserId}`,
        status: 'completed',
      });

      logger.info(`Referral reward of ${rewardAmount} sent to referrer ${referrerId}`);
    } catch (error) {
      throw error;
    }
  }
}
