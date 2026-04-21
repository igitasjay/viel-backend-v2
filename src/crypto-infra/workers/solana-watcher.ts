import * as solana from '@solana/web3.js';
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
import { logger } from '@/lib/winston';
import mongoose from 'mongoose';
import * as Decimal from '@/utils/decimal.util';

// Solana Mainnet/Devnet RPC
const connection = new solana.Connection(
  config.SOLANA_RPC_URL || solana.clusterApiUrl('mainnet-beta'),
  'confirmed',
);

export async function startSolanaWatcher(standalone = false) {
  if (standalone) {
    await connectToDatabase();
  }
  logger.info('☀️ Solana Watcher Starting...');

  try {
    const version = await connection.getVersion();
    logger.info(`Connected to Solana RPC (Version: ${version['solana-core']})`);
  } catch (error) {
    logger.error(
      'Failed to connect to Solana RPC. Please check SOLANA_RPC_URL.',
    );
    if (standalone) process.exit(1);
    return;
  }

  logger.info('Solana Watcher Started and Listening for Logs...');

  const solWallets = await Wallet.find({ network: 'SOLANA' });
  logger.info(`Monitoring ${solWallets.length} Solana addresses`);

  for (const wallet of solWallets) {
    const pubkey = new solana.PublicKey(wallet.address);

    connection.onAccountChange(
      pubkey,
      async (accountInfo, context) => {
        logger.info(
          `Solana Deposit Detected for ${wallet.address}! Slot: ${context.slot}`,
        );

        try {
          // Fetch recent signatures for this account to find the transaction
          const signatures = await connection.getSignaturesForAddress(pubkey, {
            limit: 1,
          });
          if (signatures.length === 0) return;

          const signature = signatures[0].signature;
          const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) return;

          // Calculate amount (Difference in lamports)
          const postBalance = accountInfo.lamports;
          const preBalance =
            tx.meta.preBalances[
              tx.transaction.message.accountKeys.findIndex((k) =>
                k.pubkey.equals(pubkey),
              )
            ] || 0;
          const amountLamports = postBalance - (preBalance as number);

          if (amountLamports <= 0) return; // Not an incoming transfer

          // Convert lamports to SOL using Decimal (no float division)
          const amount = Decimal.fromMinorUnits(String(amountLamports), 9);

          const coin = await Currency.findOne({
            symbol: wallet.currency,
            network: 'SOLANA',
          });

          // Atomic: ledger credit + volume update in one session
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            await LedgerService.recordEntry({
              userId: wallet.userId.toString(),
              asset: wallet.currency,
              amount,
              type: LedgerType.DEPOSIT,
              refId: signature,
              category: LedgerCategory.CRYPTO,
              action: TransactionAction.SELL,
              counterparty: SystemAccount.HOT_WALLET,
              image: coin?.imageUrl,
              status: 'completed',
              tradedAsset: wallet.currency,
              session,
            });

            if (coin) {
              const sellRateStr = String(coin.sellRate || 0);
              const nairaValue = Decimal.mul(amount, sellRateStr);
              await UserService.updateUserVolume(
                wallet.userId.toString(),
                nairaValue,
                VolumeType.SELL,
                session,
              );
            }

            await session.commitTransaction();
            logger.info(`User Credited: ${amount} ${wallet.currency}`);
          } catch (err) {
            await session.abortTransaction();
            logger.error(`Solana credit failed (likely duplicate)`, err);
          } finally {
            session.endSession();
          }

          // Notification outside session (fire-and-forget)
          await NotificationService.sendDepositNotification(
            wallet.userId.toString(),
            wallet.currency,
            parseFloat(amount),
          );
        } catch (err) {
          logger.error(
            `Failed to process Solana deposit for ${wallet.address}:`,
            err,
          );
        }
      },
      'confirmed',
    );
  }
}

if (require.main === module) {
  startSolanaWatcher(true);
}
