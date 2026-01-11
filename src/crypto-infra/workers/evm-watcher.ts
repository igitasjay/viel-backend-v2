import { ethers } from "ethers";
import dotenv from "dotenv";
import { connectDB } from "../config/database.js";
import { Wallet } from "../models/Wallet.js";
import { LedgerService } from "../services/ledger.service.js";
import { LedgerType } from "../models/Ledger.js";

dotenv.config();

// v6 Change: Removed '.providers' namespace
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);

async function startWatcher() {
  await connectDB();
  console.log("👀 EVM Watcher Started...");

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
            await LedgerService.creditUser(
              targetWallet.userId.toString(),
              targetWallet.currency,
              amount,
              LedgerType.DEPOSIT,
              tx.hash // Uses TxHash as Idempotency Key
            );
            console.log(`✅ User Credited: ${amount} ${targetWallet.currency}`);
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
