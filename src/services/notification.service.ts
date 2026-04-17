import axios from 'axios';
import config from '@/config/config';
import { Resend } from 'resend';
import {
  DepositConfirmedEmail,
  GiftCardStatusEmail,
} from '@/lib/email-template';
import User from '@/models/user.model';
import { DeviceToken } from '@/models/device-token.model';

const resend = new Resend(config.RESEND_API_KEY);

export class NotificationService {
  /**
   * Send a push notification via OneSignal
   */
  public static async sendPushNotification(
    playerIds: string[],
    heading: string,
    content: string,
  ) {
    if (!config.ONESIGNAL_APP_ID || !config.ONESIGNAL_REST_API_KEY) {
      console.warn(
        'OneSignal credentials not configured. Skipping push notification.',
      );
      return;
    }

    if (playerIds.length === 0) return;

    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: config.ONESIGNAL_APP_ID,
          include_external_user_ids: playerIds,
          headings: { en: heading },
          contents: { en: content },
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Basic ${config.ONESIGNAL_REST_API_KEY}`,
          },
        },
      );
      // log player ids
      console.log('Player ids:', playerIds);
      console.log('OneSignal Response:', response.data);
    } catch (error: any) {
      console.error(
        'Error sending push notification via OneSignal:',
        error?.response?.data || error.message,
      );
      console.log('Player ids:', playerIds);
    }
  }

  /**
   * Trigger email and push notification for a confirmed deposit
   */
  public static async sendDepositNotification(
    userId: string,
    currency: string,
    amount: number,
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // 1. Send Deposit Confirmed Email
      if (user.email) {
        try {
          await resend.emails.send({
            from: `VIEL <${config.EMAIL_FROM}>`,
            to: user.email,
            subject: 'Deposit Confirmed',
            react: DepositConfirmedEmail({
              firstname: user.firstname,
              currency,
              amount,
            }),
          });
        } catch (emailError: any) {
          console.error(
            'Error sending deposit email:',
            emailError?.response?.data || emailError.message,
          );
        }
      }

      // 2. Send Push Notification
      const tokens = await DeviceToken.find({ userId });
      const playerIds = tokens.map((t) => t.token);

      if (playerIds.length > 0) {
        const heading = 'Deposit Confirmed';
        const content = `Your deposit of ${amount} ${currency} has been successfully credited to your wallet.`;
        await this.sendPushNotification(playerIds, heading, content);
      }
    } catch (error) {
      console.error('Error in sendDepositNotification:', error);
    }
  }

  /**
   * Trigger email and push notification for gift card admin actions
   */
  public static async sendGiftCardStatusNotification(
    userId: string | any,
    actionType: 'buy' | 'sell',
    status: 'approved' | 'rejected' | 'completed' | 'declined',
    amount?: number,
    currency?: string,
    adminComment?: string,
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const isApproved = status === 'approved' || status === 'completed';
      const verb = actionType === 'buy' ? 'Purchase' : 'Sale';

      // 1. Send Email
      if (user.email) {
        try {
          await resend.emails.send({
            from: `VIEL <${config.EMAIL_FROM}>`,
            to: user.email,
            subject: `Gift Card ${verb} ${status}`,
            react: GiftCardStatusEmail({
              firstname: user.firstname,
              actionType,
              status,
              amount,
              currency,
              adminComment,
            }),
          });
        } catch (emailError: any) {
          console.error(
            'Error sending gift card status email:',
            emailError?.response?.data || emailError.message,
          );
        }
      }

      // 2. Send Push Notification
      const tokens = await DeviceToken.find({ userId });
      const playerIds = tokens.map((t) => t.token);

      if (playerIds.length > 0) {
        const icon = isApproved ? '✅' : '❌';
        const heading = `Gift Card ${verb} ${status} ${icon}`;
        const content = isApproved
          ? `Your gift card ${actionType} request has been approved.`
          : `Your gift card ${actionType} request was declined.`;

        await this.sendPushNotification(playerIds, heading, content);
      }
    } catch (error) {
      console.error('Error in sendGiftCardStatusNotification:', error);
    }
  }
}
