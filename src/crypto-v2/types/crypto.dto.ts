import { z } from 'zod';
import mongoose from 'mongoose';

// Ensure the ID is a valid ObjectId if we want to use MongoDB IDs. Or string depending on usage.
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

// Zod schemas for validation
export const getQuoteSchema = z.object({
  coin: z.string({ message: 'Coin is required' }),
  chain: z.string({ message: 'Chain is required' }),
  amountNGN: z.number({ message: 'Amount is required' }).positive('Amount must be positive'),
});

export const executeBuySchema = z.object({
  quoteId: z.string({ message: 'Quote ID is required' }),
  destinationAddress: z.string({ message: 'Destination address is required' }).min(10, 'Valid address required'),
});

export const addWhitelistSchema = z.object({
  coin: z.string({ message: 'Coin is required' }),
  chain: z.string({ message: 'Chain is required' }),
  address: z.string({ message: 'Address is required' }).min(10, 'Valid address required'),
  label: z.string().optional(),
});

export const generateWalletSchema = z.object({
  coin: z.string({ message: 'Coin is required' }),
  chain: z.string({ message: 'Chain is required' }),
});

export const webhookPayloadSchema = z.object({
  type: z.string(),
  currency: z.string(),
  amount: z.number(),
  status: z.string(),
  reference: z.string(),
  transactionId: z.string(),
  createdAt: z.string(),
  lastUpdated: z.string(),
  hash: z.string(),
  network: z.string(),
  address: z.string(),
});

export type GetQuoteDto = z.infer<typeof getQuoteSchema>;
export type ExecuteBuyDto = z.infer<typeof executeBuySchema>;
export type AddWhitelistDto = z.infer<typeof addWhitelistSchema>;
export type GenerateWalletDto = z.infer<typeof generateWalletSchema>;
export type WebhookPayloadDto = z.infer<typeof webhookPayloadSchema>;
