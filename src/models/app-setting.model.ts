import { Schema, model, Document } from 'mongoose';

export interface IAppSetting extends Document {
  referralRewardAmount: number;
  cryptoBuyAdminApprovalThreshold: number;
}

const AppSettingSchema = new Schema<IAppSetting>(
  {
    referralRewardAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    cryptoBuyAdminApprovalThreshold: {
      type: Number,
      required: true,
      default: 1000000,
    },
  },
  {
    timestamps: true,
  }
);

export default model<IAppSetting>('AppSetting', AppSettingSchema);
