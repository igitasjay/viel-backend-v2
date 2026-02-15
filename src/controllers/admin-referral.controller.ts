import { Ledger } from '@/crypto-infra/models/Ledger';
import AppSetting from '@/models/app-setting.model';
import BankAccount from '@/models/bank.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';

const getPayoutHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const rewards = await Ledger.find({ type: 'REFERRAL_REWARD' })
      .populate('userId', 'firstname lastname email phone')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const results = await Promise.all(rewards.map(async (reward) => {
      const bank = await BankAccount.findOne({ userId: reward.userId }).lean().exec();
      return {
        ...reward,
        bankDetails: bank,
      };
    }));

    const settings = await AppSetting.findOne().exec();

    res.status(200).json({
      rewards: results,
      currentReferralRewardAmount: settings?.referralRewardAmount || 0,
    });
  } catch (error) {
    logger.error('Error fetching payout history', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Failed to fetch payout history.',
    });
  }
};

export { getPayoutHistory };
