import { Ledger } from '@/crypto-infra/models/Ledger';
import AppSetting from '@/models/app-setting.model';
import BankAccount from '@/models/bank.model';
import Referral from '@/models/referral.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import { disburseFunds } from '@/services/monnify.service';
import mongoose from 'mongoose';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '@/crypto-infra/models/Ledger';

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

const getReferrals = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query; // pending_eligibility, eligible, approved, etc.

  try {
    const filter: any = {};
    if (status) filter.status = status;

    const referrals = await Referral.find(filter)
      .populate('referrerId', 'firstname lastname email phone')
      .populate('referredUserId', 'firstname lastname email phone')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const results = await Promise.all(referrals.map(async (ref) => {
      const bank = await BankAccount.findOne({ userId: ref.referrerId }).lean().exec();
      return {
        ...ref,
        referrerBankDetails: bank,
      };
    }));

    res.status(200).json({
      success: true,
      referrals: results,
    });
  } catch (error) {
    logger.error('Error fetching referrals', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Failed to fetch referrals.',
    });
  }
};

const approveReferral = async (req: Request, res: Response): Promise<void> => {
  const referralId = req.query.referralId as string;

  if (!referralId) {
    res.status(400).json({ code: 'BadRequest', message: 'referralId query parameter is required.' });
    return;
  }

  try {
    const referral = await Referral.findById(referralId).exec();
    if (!referral) {
      res.status(404).json({ code: 'NotFound', message: 'Referral not found.' });
      return;
    }

    if (referral.status !== 'eligible') {
      res.status(400).json({
        code: 'InvalidStatus',
        message: `Referral must be 'eligible' to be approved. Current status: ${referral.status}`,
      });
      return;
    }

    const referrerBank = await BankAccount.findOne({ userId: referral.referrerId }).exec();
    if (!referrerBank) {
      res.status(400).json({
        code: 'MissingBankDetails',
        message: 'Referrer has not added bank details. Cannot disburse.',
      });
      return;
    }

    const reference = `ref_reward_${referral.referredUserId}_${Date.now()}`;

    // Disburse via Monnify
    await disburseFunds({
      amount: referral.rewardAmount,
      reference,
      narration: `Referral reward for referring user ID: ${referral.referredUserId}`,
      destinationBankCode: referrerBank.bankCode,
      destinationAccountNumber: referrerBank.accountNumber,
      currency: 'NGN',
    });

    // Update Referral
    referral.status = 'disbursed';
    referral.approvedAt = new Date();
    referral.disbursementReference = reference;
    await referral.save();

    // Create Ledger entry
    await Ledger.create({
      userId: referral.referrerId,
      asset: 'NGN',
      amount: referral.rewardAmount,
      type: 'REFERRAL_REWARD',
      transactionCategory: LedgerCategory.GIFTCARD,
      transactionType: TransactionAction.SELL,
      referenceId: reference,
      description: `Referral reward payout for user ${referral.referredUserId}`,
      status: 'completed',
    });

    logger.info(`Referral ${referralId} approved and disbursed by admin.`);

    res.status(200).json({
      success: true,
      message: 'Referral reward approved and disbursed successfully.',
      referral,
    });
  } catch (error: any) {
    logger.error('Error approving referral', { referralId, error });
    res.status(500).json({
      code: 'ServerError',
      message: error.message || 'Failed to approve referral reward.',
    });
  }
};

export { getPayoutHistory, getReferrals, approveReferral };
