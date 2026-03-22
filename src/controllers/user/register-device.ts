import { Request, Response } from 'express';
import { DeviceToken, Platform } from '@/models/device-token.model';

export const registerDeviceToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Device token is required' });
    }

    if (platform && !Object.values(Platform).includes(platform as Platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    // Upsert the token for the user to avoid duplicates
    await DeviceToken.findOneAndUpdate(
      { userId, token },
      { platform },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Device token registered successfully' });
  } catch (error: any) {
    console.error('Error registering device token:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default registerDeviceToken;
