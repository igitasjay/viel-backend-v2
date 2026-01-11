import mongoose from 'mongoose';
import { Ledger, LedgerType } from '../models/Ledger';

export class LedgerService {
  /**
   * Atomic Credit: Ensures balance is updated exactly once.
   */
  static async creditUser(
    userId: string,
    asset: string,
    amount: number,
    type: LedgerType,
    refId: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Check Idempotency (Has this refId been processed?)
      const existing = await Ledger.findOne({ referenceId: refId }).session(
        session,
      );
      if (existing) {
        console.warn(`Duplicate transaction attempt: ${refId}`);
        await session.abortTransaction();
        return existing;
      }

      // 2. Create Ledger Entry
      const entry = await Ledger.create(
        [
          {
            userId,
            asset,
            amount, // Positive
            type,
            referenceId: refId,
            description: `Credit ${amount} ${asset} via ${type}`,
          },
        ],
        { session },
      );

      // 3. Commit
      await session.commitTransaction();
      return entry[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
