import AppSetting from '@/models/app-setting.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';

const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await AppSetting.findOne().exec();
    if (!settings) {
      settings = await AppSetting.create({ referralRewardAmount: 0 });
    }
    res.status(200).json({ settings });
  } catch (error) {
    logger.error('Error fetching settings', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Failed to fetch settings.',
    });
  }
};

const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const { referralRewardAmount } = req.body;

  try {
    let settings = await AppSetting.findOne().exec();
    if (!settings) {
      settings = new AppSetting();
    }

    if (referralRewardAmount !== undefined) {
      settings.referralRewardAmount = referralRewardAmount;
    }

    await settings.save();
    logger.info('Admin updated settings', { referralRewardAmount });

    res.status(200).json({
      message: 'Settings updated successfully.',
      settings,
    });
  } catch (error) {
    logger.error('Error updating settings', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Failed to update settings.',
    });
  }
};

export { getSettings, updateSettings };
