import mongoose, { Schema, model, Document } from 'mongoose';

export type TransactionType = 'buy_crypto' | 'deposit_crypto' | 'withdraw_fiat' | 'buy_giftcard';
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
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  coin?: string;
  network?: string;
  crypto_amount?: string;
  fiat_amount?: string; // Naira amount
  receive_address?: string;
  reference?: string; // Paystack or Monnify reference
  status: TransactionStatus;
  paystack_data?: any;
  monnify_data?: any;
  giftcard_data?: any;
  metadata?: Record<string, any>;
  image?: string;
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
      enum: ['buy_crypto', 'deposit_crypto', 'withdraw_fiat', 'buy_giftcard'],
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
    monnify_data: { type: Schema.Types.Mixed },
    giftcard_data: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed, default: {} },
    image: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default model<ITransaction>('Transaction', TransactionSchema);
