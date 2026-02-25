import User from '@/models/user.model';
import mongoose from 'mongoose';
import AppSetting from '@/models/app-setting.model';
import BankAccount from '@/models/bank.model';
import Referral from '@/models/referral.model';
import { disburseFunds } from './monnify.service';
import { Ledger } from '@/crypto-infra/models/ledger.model';
import { logger } from '@/lib/winston';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '@/crypto-infra/models/ledger.model';

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
      const referral = await Referral.findOne({
        referrerId: new mongoose.Types.ObjectId(referrerId),
        referredUserId: new mongoose.Types.ObjectId(referredUserId),
        status: 'pending_eligibility',
      }).exec();

      if (!referral) return;

      const settings = await AppSetting.findOne().exec();
      const rewardAmount = settings?.referralRewardAmount || 0;

      referral.status = 'eligible';
      referral.rewardAmount = rewardAmount;
      referral.eligibleAt = new Date();
      await referral.save();

      logger.info(`Referral for User ${referredUserId} (Referrer: ${referrerId}) now ELIGIBLE for reward of ${rewardAmount}`);
    } catch (error) {
      logger.error('Error updating referral eligibility', { referrerId, referredUserId, error });
    }
  }
}
