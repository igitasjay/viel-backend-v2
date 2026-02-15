import { Schema, model, Document } from 'mongoose';

export interface IAppSetting extends Document {
  referralRewardAmount: number;
}

const AppSettingSchema = new Schema<IAppSetting>(
  {
    referralRewardAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default model<IAppSetting>('AppSetting', AppSettingSchema);
