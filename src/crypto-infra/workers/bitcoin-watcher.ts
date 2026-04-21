import axios from 'axios';
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

// Using Blockstream's public API for this prototype
const BITCOIN_API_BASE =
  config.BITCOIN_API_URL || 'https://blockstream.info/api';

export async function startBitcoinWatcher(standalone = false) {
  if (standalone) {
    await connectToDatabase();
  }
  logger.info('₿ Bitcoin Watcher Starting (Polling Mode)...');

  // Poll every 60 seconds
  setInterval(async () => {
    try {
      const btcWallets = await Wallet.find({ network: 'BITCOIN' });
      if (btcWallets.length === 0) return;

      logger.info(`Polling ${btcWallets.length} Bitcoin addresses...`);

      for (const wallet of btcWallets) {
        try {
          // 1. Get transaction history for address
          const response = await axios.get(
            `${BITCOIN_API_BASE}/address/${wallet.address}/txs`,
          );
          const txs = response.data;

          if (!txs || txs.length === 0) continue;

          // 2. Check the most recent transaction
          const latestTx = txs[0];
          if (!latestTx.status.confirmed) continue;

          // 3. Find the output sent to our user's address
          const vout = latestTx.vout.find(
            (v: any) => v.scriptpubkey_address === wallet.address,
          );
          if (!vout) continue;

          // 4. Convert satoshis to BTC using Decimal (no float division)
          const amountBTC = Decimal.fromMinorUnits(String(vout.value), 8);

          const coin = await Currency.findOne({
            symbol: wallet.currency,
            network: 'BITCOIN',
          });

          // 5. Atomic: ledger credit + volume update in one session
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            await LedgerService.recordEntry({
              userId: wallet.userId.toString(),
              asset: wallet.currency,
              amount: amountBTC,
              type: LedgerType.DEPOSIT,
              refId: latestTx.txid,
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
              const nairaValue = Decimal.mul(amountBTC, sellRateStr);
              await UserService.updateUserVolume(
                wallet.userId.toString(),
                nairaValue,
                VolumeType.SELL,
                session,
              );
            }

            await session.commitTransaction();
            logger.info(
              `Bitcoin Deposit Processed! ${amountBTC} BTC for ${wallet.address}`,
            );
          } catch (err) {
            await session.abortTransaction();
            logger.error(`Bitcoin credit failed (likely duplicate)`, err);
          } finally {
            session.endSession();
          }

          // Notification outside session (fire-and-forget)
          await NotificationService.sendDepositNotification(
            wallet.userId.toString(),
            wallet.currency,
            parseFloat(amountBTC),
          );
        } catch (err: any) {
          // Log but don't stop the loop
          logger.error(
            `Error checking Bitcoin address ${wallet.address}:`,
            err.message,
          );
        }
      }
    } catch (error: any) {
      logger.error('Bitcoin Watcher polling cycle failed:', error.message);
    }
  }, 60000);
}

if (require.main === module) {
  startBitcoinWatcher(true);
}
