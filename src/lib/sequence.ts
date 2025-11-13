import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import { logger } from '@/lib/winston';

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

export const getNextSequence = async (name: string): Promise<number> => {
  await connectToDatabase();
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return counter!.seq;
};
