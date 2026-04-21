import { ethers } from 'ethers';
import { Wallet } from '../models/wallet.model';
import { Currency } from '../models/currency.model';
import { LedgerService } from '../services/ledger.service';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
  SystemAccount,
} from '../models/ledger.model';
import { connectToDatabase } from '@/lib/mongoose';
import { UserService, VolumeType } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import config from '@/config/config';
import mongoose from 'mongoose';
import * as Decimal from '@/utils/decimal.util';

const provider = new ethers.JsonRpcProvider(config.ALCHEMY_RPC_URL);

export async function startWatcher(standalone = false) {
  if (standalone) {
    await connectToDatabase();
  }
  console.log('EVM Watcher Starting...');

  try {
    const network = await provider.getNetwork();
    const currentBlock = await provider.getBlockNumber();
    console.log(`Connected to ${network.name} (ChainID: ${network.chainId})`);
    console.log(`Current Block Height: ${currentBlock}`);
  } catch (error) {
    console.error(
      'Failed to connect to Provider. Please check ALCHEMY_RPC_URL.',
    );
    if (standalone) process.exit(1);
    return; // Don't crash the main server
  }

  console.log('EVM Watcher Started and Listening...');

  // Listen to every block
  provider.on('block', async (blockNumber: number) => {
    console.log(`New Block: ${blockNumber}`);

    try {
      const block = await provider.getBlock(blockNumber, true);

      if (!block || !block.prefetchedTransactions) return;

      for (const tx of block.prefetchedTransactions) {
        // 1. Optimization: Check if 'to' exists in our DB cache
        if (!tx.to) continue; // Skip contract creations

        const targetWallet = await Wallet.findOne({ address: tx.to });

        if (targetWallet) {
          console.log(`Deposit Detected! ${tx.value} wei to ${tx.to}`);

          // 2. Wait for confirmations (Optional logic)
          // await tx.wait(12);

          // 3. Normalize Amount — keep as string, no Number() conversion
          const amount = ethers.formatEther(tx.value);

          // 4. Credit User in atomic session (Idempotent via TxHash)
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            const coin = await Currency.findOne({
              symbol: targetWallet.currency,
            });

            await LedgerService.recordEntry({
              userId: targetWallet.userId.toString(),
              asset: targetWallet.currency,
              amount,
              type: LedgerType.DEPOSIT,
              refId: tx.hash, // Uses TxHash as Idempotency Key
              category: LedgerCategory.CRYPTO,
              action: TransactionAction.SELL,
              counterparty: SystemAccount.HOT_WALLET,
              image: coin?.imageUrl,
              status: 'completed',
              tradedAsset: targetWallet.currency,
              session,
            });

            // Update User Trading Volume atomically
            if (coin) {
              const sellRateStr = String(coin.sellRate || 0);
              const nairaValue = Decimal.mul(amount, sellRateStr);
              await UserService.updateUserVolume(
                targetWallet.userId.toString(),
                nairaValue,
                VolumeType.SELL,
                session,
              );
              console.log(`User Volume Updated: ${nairaValue} NGN`);
            }

            await session.commitTransaction();
            console.log(`User Credited: ${amount} ${targetWallet.currency}`);
          } catch (err) {
            await session.abortTransaction();
            console.error('Credit failed (likely duplicate)', err);
          } finally {
            session.endSession();
          }

          // Trigger notification (fire-and-forget, outside session)
          await NotificationService.sendDepositNotification(
            targetWallet.userId.toString(),
            targetWallet.currency,
            parseFloat(amount),
          );
        }
      }
    } catch (error) {
      console.error(`Error processing block ${blockNumber}:`, error);
    }
  });
}

// Auto-start when run directly (e.g. `npm run watcher:dev`)
// When imported from server.ts, this won't execute
if (require.main === module) {
  startWatcher(true);
}
