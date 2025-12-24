import { Schema, model, models, Document } from 'mongoose';

export interface IDepositAddress extends Document {
  userId: string;
  address: string; // checksum hex
  chain: string; // e.g. "ethereum", "polygon"
  createdAt: Date;
  meta?: Record<string, any>;
}

const DepositAddressSchema = new Schema<IDepositAddress>({
  userId: { type: String, required: true, index: true },
  address: { type: String, required: true, index: true },
  chain: { type: String, required: true, default: 'ethereum' },
  createdAt: { type: Date, default: () => new Date() },
  meta: { type: Schema.Types.Mixed },
});

const DepositAddressModel =
  models.DepositAddress ||
  model<IDepositAddress>('DepositAddress', DepositAddressSchema);

export { DepositAddressModel as DepositAddress };
