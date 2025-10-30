// src/services/index.service.ts
import Counter from '@/models/counter.model';

export async function getNextDepositIndex(network: string): Promise<number> {
  const counterId = `depositIndex:${network.toUpperCase()}`;
  const doc = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc.seq;
}
