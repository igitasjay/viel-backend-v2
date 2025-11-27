import { Schema, model, Document } from 'mongoose';

export type TransactionType = 'buy_crypto' | 'deposit_crypto' | 'withdraw_fiat';
export type TransactionStatus =
  | 'pending'
  | 'initialized'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ITransaction extends Document {
  id: number;
  userId: Schema.Types.ObjectId;
  type: TransactionType;
  coin?: string;
  network?: string;
  crypto_amount?: string;
  fiat_amount?: string; // Naira amount
  receive_address?: string;
  reference?: string; // Paystack reference
  status: TransactionStatus;
  paystack_data?: any;
  metadata?: Record<string, any>;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    id: { type: Number, unique: true, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['buy_crypto', 'deposit_crypto', 'withdraw_fiat'],
      required: true,
    },
    coin: { type: String },
    network: { type: String },
    crypto_amount: { type: String },
    fiat_amount: { type: String },
    receive_address: { type: String },
    reference: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: [
        'pending',
        'initialized',
        'paid',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ],
      default: 'pending',
    },
    paystack_data: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default model<ITransaction>('Transaction', TransactionSchema);
