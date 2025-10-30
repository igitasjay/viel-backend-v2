// src/models/crypto.model.ts
import { Schema, model, Document } from 'mongoose';

export interface INetwork {
  id: number;
  name: string;
  code: string;
  addressRegex: string;
  memoRegex?: string | null;
  fee: string;
  feeType: 'FLAT' | 'PERCENTAGE';
  minimum: string;
  contractAddress?: string | null;
  explorerLink?: string | null;
  walletAddress: string;
  enabled: boolean;
}

export interface ICryptoAsset extends Document {
  id: number;
  name: string;
  code: string;
  icon: string;
  networks: INetwork[];
  status: 0 | 1;
  is_stable: 0 | 1;
  color: string;
  minimumDeposit: string;
  maximumDecimalPlaces: number;
  naira_rate: string;
  usd_rate: string;
  created_at: Date;
  updated_at: Date;
}

const NetworkSchema = new Schema<INetwork>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    addressRegex: { type: String, required: true },
    memoRegex: { type: String, default: null },
    fee: { type: String, required: true },
    feeType: { type: String, enum: ['FLAT', 'PERCENTAGE'], required: true },
    minimum: { type: String, required: true },
    contractAddress: { type: String, default: null },
    explorerLink: { type: String, default: null },
    walletAddress: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const CryptoAssetSchema = new Schema<ICryptoAsset>(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true, unique: true },
    icon: { type: String, required: true },
    networks: [NetworkSchema],
    status: { type: Number, enum: [0, 1], default: 1 },
    is_stable: { type: Number, enum: [0, 1], default: 0 },
    color: { type: String, required: true },
    minimumDeposit: { type: String, required: true },
    maximumDecimalPlaces: { type: Number, required: true },
    naira_rate: { type: String, required: true },
    usd_rate: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default model<ICryptoAsset>('CryptoAsset', CryptoAssetSchema);
