import { ethers } from "ethers";
import { Wallet } from "../models/wallet.model";
import { Currency } from "../models/currency.model";
import { LedgerService } from "../services/ledger.service";
import { LedgerType, LedgerCategory, TransactionAction } from "../models/ledger.model";
import { connectToDatabase } from "@/lib/mongoose";
import { UserService, VolumeType } from "../../services/user.service";
import { NotificationService } from "../../services/notification.service";
import config from "@/config/config";

// v6 Change: Removed '.providers' namespace
const provider = new ethers.JsonRpcProvider(config.ALCHEMY_RPC_URL);

export async function startWatcher(standalone = false) {
  if (standalone) {
    await connectToDatabase();
  }
  console.log("👀 EVM Watcher Starting...");

  try {
    const network = await provider.getNetwork();
    const currentBlock = await provider.getBlockNumber();
    console.log(`Connected to ${network.name} (ChainID: ${network.chainId})`);
    console.log(`Current Block Height: ${currentBlock}`);
  } catch (error) {
    console.error("Failed to connect to Provider. Please check ALCHEMY_RPC_URL.");
    if (standalone) process.exit(1);
    return; // Don't crash the main server
  }

  console.log("EVM Watcher Started and Listening...");

  // Listen to every block
  provider.on("block", async (blockNumber: number) => {
    console.log(`New Block: ${blockNumber}`);

    try {
      // v6 Change: getBlockWithTransactions is gone.
      // Use getBlock(number, true) to include full transaction objects.
      const block = await provider.getBlock(blockNumber, true);

      if (!block || !block.prefetchedTransactions) return;

      for (const tx of block.prefetchedTransactions) {
        // 1. Optimization: Check if 'to' exists in our DB cache
        if (!tx.to) continue; // Skip contract creations

        const targetWallet = await Wallet.findOne({ address: tx.to });

        if (targetWallet) {
          console.log(`💰 Deposit Detected! ${tx.value} wei to ${tx.to}`);

          // 2. Wait for confirmations (Optional logic)
          // await tx.wait(12);

          // 3. Normalize Amount (v6 Change: moved to top-level)
          const amount = Number(ethers.formatEther(tx.value));

          // 4. Credit User (Idempotent via TxHash)
          try {
            const coin = await Currency.findOne({
              symbol: targetWallet.currency,
            });

            await LedgerService.creditUser(
              targetWallet.userId.toString(),
              targetWallet.currency,
              amount,
              LedgerType.DEPOSIT,
              tx.hash, // Uses TxHash as Idempotency Key
              LedgerCategory.CRYPTO,
              TransactionAction.SELL,
              coin?.imageUrl,
              'completed',
              targetWallet.currency,
            );
            console.log(`✅ User Credited: ${amount} ${targetWallet.currency}`);

            // Trigger notification
            await NotificationService.sendDepositNotification(
              targetWallet.userId.toString(),
              targetWallet.currency,
              amount
            );

            // Update User Trading Volume
            if (coin) {
              const nairaValue = amount * (coin.sellRate || 0);
              await UserService.updateUserVolume(
                targetWallet.userId.toString(),
                nairaValue,
                VolumeType.SELL,
              );
              console.log(`📈 User Volume Updated: ${nairaValue} NGN`);
            }
          } catch (err) {
            console.error("Credit failed (likely duplicate)", err);
          }
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
