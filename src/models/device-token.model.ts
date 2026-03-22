import mongoose, { Schema, Document } from 'mongoose';

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform?: Platform;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true },
    platform: { type: String, enum: Object.values(Platform) },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have a specific token once
DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

export const DeviceToken = mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
