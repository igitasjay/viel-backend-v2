import { ethers } from "ethers";
import dotenv from "dotenv";
import { Wallet } from "../models/Wallet.js";
import { Currency } from "../models/Currency.js";
import { LedgerService } from "../services/ledger.service.js";
import { LedgerType, LedgerCategory, TransactionAction } from "../models/Ledger.js";
import { connectToDatabase } from "@/lib/mongoose.js";
import { UserService, VolumeType } from "../../services/user.service.js";

dotenv.config();

// v6 Change: Removed '.providers' namespace
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);

async function startWatcher() {
  await connectToDatabase();
  console.log("👀 EVM Watcher Starting...");

  try {
    const network = await provider.getNetwork();
    const currentBlock = await provider.getBlockNumber();
    console.log(`📡 Connected to ${network.name} (ChainID: ${network.chainId})`);
    console.log(`⛓️  Current Block Height: ${currentBlock}`);
  } catch (error) {
    console.error("❌ Failed to connect to Provider. Please check ALCHEMY_RPC_URL.");
    process.exit(1);
  }

  console.log("🚀 EVM Watcher Started and Listening...");

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
            );
            console.log(`✅ User Credited: ${amount} ${targetWallet.currency}`);

            // Update User Trading Volume
            if (coin) {
              const nairaValue = amount * coin.naira_rate;
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

startWatcher();
