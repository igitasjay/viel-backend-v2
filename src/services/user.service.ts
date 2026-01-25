import User from '@/models/user.model';
import mongoose from 'mongoose';

export enum VolumeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class UserService {
  /**
   * Update user trading volume atomically
   * @param userId User ID
   * @param amount Naira amount to add to volume
   * @param type Whether it's a BUY or SELL
   * @param session Mongoose session for transaction stability
   */
  static async updateUserVolume(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    type: VolumeType,
    session?: mongoose.ClientSession
  ) {
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

    return await User.findByIdAndUpdate(
      userId,
      update,
      { session, new: true }
    );
  }
}
