import axios from 'axios';
import { Wallet } from '../models/wallet.model';
import { Currency } from '../models/currency.model';
import { LedgerService } from '../services/ledger.service';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '../models/ledger.model';
import { connectToDatabase } from '@/lib/mongoose';
import { UserService, VolumeType } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import config from '@/config/config';
import { logger } from '@/lib/winston';

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

          // 3. Check if this tx was already processed (using refId in the Ledger)
          // Note: In production, we'd use a more efficient way to track processed TXs

          // 4. Find the output sent to our user's address
          const vout = latestTx.vout.find(
            (v: any) => v.scriptpubkey_address === wallet.address,
          );
          if (!vout) continue;

          const amountBTC = vout.value / 100000000; // Satoshis to BTC

          const coin = await Currency.findOne({
            symbol: wallet.currency,
            network: 'BITCOIN',
          });

          // creditUser is idempotent via referenceId (latestTx.txid)
          await LedgerService.creditUser(
            wallet.userId.toString(),
            wallet.currency,
            amountBTC,
            LedgerType.DEPOSIT,
            latestTx.txid,
            LedgerCategory.CRYPTO,
            TransactionAction.SELL,
            coin?.imageUrl,
            'completed',
            wallet.currency,
          );

          logger.info(
            `Bitcoin Deposit Processed! ${amountBTC} BTC for ${wallet.address}`,
          );

          await NotificationService.sendDepositNotification(
            wallet.userId.toString(),
            wallet.currency,
            amountBTC,
          );

          if (coin) {
            const nairaValue = amountBTC * (coin.sellRate || 0);
            await UserService.updateUserVolume(
              wallet.userId.toString(),
              nairaValue,
              VolumeType.SELL,
            );
          }
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
