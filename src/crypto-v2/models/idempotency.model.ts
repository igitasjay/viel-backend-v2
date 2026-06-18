import { Schema, model, Document, Types } from 'mongoose';

export interface IIdempotency extends Document {
  key: string;
  userId: Types.ObjectId;
  endpoint: string;
  responseBody?: string;
  createdAt: Date;
}

const IdempotencySchema = new Schema<IIdempotency>(
  {
    key: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true },
    responseBody: { type: String },
    createdAt: { type: Date, default: Date.now, index: { expires: '24h' } }, // TTL index
  },
  { timestamps: true }
);

export const IdempotencyModel = model<IIdempotency>('CryptoIdempotencyV2', IdempotencySchema);
