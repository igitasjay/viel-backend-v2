import * as solana from "@solana/web3.js";
import { Wallet } from "../models/wallet.model";
import { Currency } from "../models/currency.model";
import { LedgerService } from "../services/ledger.service";
import { LedgerType, LedgerCategory, TransactionAction } from "../models/ledger.model";
import { connectToDatabase } from "@/lib/mongoose";
import { UserService, VolumeType } from "../../services/user.service";
import { NotificationService } from "../../services/notification.service";
import config from "@/config/config";
import { logger } from "@/lib/winston";

// Solana Mainnet/Devnet RPC
const connection = new solana.Connection(config.SOLANA_RPC_URL || solana.clusterApiUrl('mainnet-beta'), 'confirmed');

export async function startSolanaWatcher(standalone = false) {
  if (standalone) {
    await connectToDatabase();
  }
  logger.info("☀️ Solana Watcher Starting...");

  try {
    const version = await connection.getVersion();
    logger.info(`Connected to Solana RPC (Version: ${version["solana-core"]})`);
  } catch (error) {
    logger.error("Failed to connect to Solana RPC. Please check SOLANA_RPC_URL.");
    if (standalone) process.exit(1);
    return;
  }

  logger.info("Solana Watcher Started and Listening for Logs...");

  // In Solana, we can listen for logs mentioning our addresses
  // For a large number of addresses, we use Program Account filters or Webhooks.
  // For this implementation, we will fetch all SOL wallets and subscribe to each.
  
  const solWallets = await Wallet.find({ network: 'SOLANA' });
  logger.info(`Monitoring ${solWallets.length} Solana addresses`);

  for (const wallet of solWallets) {
    const pubkey = new solana.PublicKey(wallet.address);
    
    connection.onAccountChange(pubkey, async (accountInfo, context) => {
      logger.info(`💰 Solana Deposit Detected for ${wallet.address}! Slot: ${context.slot}`);

      try {
        // Fetch recent signatures for this account to find the transaction
        const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1 });
        if (signatures.length === 0) return;

        const signature = signatures[0].signature;
        const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });

        if (!tx || !tx.meta) return;

        // Calculate amount (Difference in lamports)
        const postBalance = accountInfo.lamports;
        const preBalance = tx.meta.preBalances[tx.transaction.message.accountKeys.findIndex(k => k.pubkey.equals(pubkey))] || 0;
        const amountLamports = postBalance - (preBalance as number);

        if (amountLamports <= 0) return; // Not an incoming transfer

        const amount = amountLamports / solana.LAMPORTS_PER_SOL;

        const coin = await Currency.findOne({ symbol: wallet.currency, network: 'SOLANA' });

        await LedgerService.creditUser(
          wallet.userId.toString(),
          wallet.currency,
          amount,
          LedgerType.DEPOSIT,
          signature, // Reference ID
          LedgerCategory.CRYPTO,
          TransactionAction.SELL,
          coin?.imageUrl,
          'completed',
          wallet.currency,
        );

        logger.info(`✅ User Credited: ${amount} ${wallet.currency}`);

        await NotificationService.sendDepositNotification(
          wallet.userId.toString(),
          wallet.currency,
          amount
        );

        if (coin) {
          const nairaValue = amount * (coin.sellRate || 0);
          await UserService.updateUserVolume(
            wallet.userId.toString(),
            nairaValue,
            VolumeType.SELL,
          );
        }
      } catch (err) {
        logger.error(`Failed to process Solana deposit for ${wallet.address}:`, err);
      }
    }, 'confirmed');
  }
}

if (require.main === module) {
  startSolanaWatcher(true);
}
