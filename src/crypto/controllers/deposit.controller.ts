// controllers/depositController.ts
import { Request, Response } from 'express';
import { DepositAddress } from '@/crypto/models/deposit-address';
import { Deposit } from '@/crypto/models/deposit';

// placeholder — implement real address derivation or allocation
async function generateDepositAddressForUser(userId: string): Promise<string> {
  // TODO: derive from HD wallet or allocate from pool
  // For example only — replace with deterministic generation
  const fake = '0x' + Math.random().toString(16).slice(2).padEnd(40, '0');
  return fake;
}

export async function allocateAddress(req: Request, res: Response) {
  const { chain = 'ethereum' } = req.body;
  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const address = await generateDepositAddressForUser(userId.toString());
  const doc = await DepositAddress.create({ userId, address, chain });
  return res.status(201).json({ address: doc.address, id: doc._id });
}

export async function getDeposit(req: Request, res: Response) {
  const { txHash } = req.params;
  const deposit = await Deposit.findOne({ txHash });
  if (!deposit) return res.status(404).json({ error: 'not found' });
  return res.json(deposit);
}

export async function listUserDeposits(req: Request, res: Response) {
  const { userId } = req.params;
  const deposits = await Deposit.find({ userId })
    .sort({ firstSeenAt: -1 })
    .limit(100);
  return res.json(deposits);
}
