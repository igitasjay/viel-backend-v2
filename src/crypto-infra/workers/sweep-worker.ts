import cron from 'node-cron';
import { ethers } from 'ethers';
import { connectToDatabase } from '@/lib/mongoose';
import { Wallet } from '../models/wallet.model';
import { WalletService } from '../services/wallet.service';
import config from '@/config/config';
import { logger } from '@/lib/winston';

/**
 * Automates the movement of funds from user deposit addresses to the platform cold wallet.
 * Runs daily to consolidate assets and minimize risk.
 */
export async function startSweepWorker() {
  console.log('--- Crypto Sweep Worker Initializing ---');
  
  // Schedule: 12:00 PM every day
  cron.schedule('0 12 * * *', async () => {
    logger.info('Starting scheduled daily sweep...');
    
    try {
      // 1. Fetch all EVM-based wallets
      const wallets = await Wallet.find({
        network: { $in: ['ETH', 'SEPOLIA', 'ERC20', 'BSC', 'POLYGON'] }
      });

      logger.info(`Checking ${wallets.length} wallets for sweepable balances...`);

      const provider = WalletService.getEVMProvider();
      const thresholdWei = ethers.parseEther(config.SWEEP_THRESHOLD_ETH);
      const destAddress = config.COLD_WALLET_EVM;

      for (const walletRecord of wallets) {
        try {
          const balance = await provider.getBalance(walletRecord.address);

          if (balance >= thresholdWei) {
            logger.info(`Threshold met for ${walletRecord.address}: ${ethers.formatEther(balance)} ETH. Initiating sweep...`);
            
            const signer = await WalletService.getSigner(walletRecord.derivationPath);
            
            // Calculate gas for standard transfer
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
            const gasLimit = 21000n;
            const gasCost = gasPrice * gasLimit;

            if (balance <= gasCost) {
              logger.warn(`Balance for ${walletRecord.address} barely covers gas. Skipping.`);
              continue;
            }

            const amountToSweep = balance - gasCost;

            const tx = await signer.sendTransaction({
              to: destAddress,
              value: amountToSweep,
              gasLimit,
              gasPrice,
            });

            logger.info(`Sweep TX Sent for ${walletRecord.address}. Hash: ${tx.hash}`);
            await tx.wait();
            logger.info(`Sweep Confirmed for ${walletRecord.address}`);
          }
        } catch (err: any) {
          logger.error(`Failed to sweep wallet ${walletRecord.address}:`, err.message);
        }
      }

      logger.info('Scheduled daily sweep completed.');
    } catch (error: any) {
      logger.error('Critical error in Sweep Worker:', error.message);
    }
  });

  console.log('Crypto Sweep Worker Scheduled for 12:00 PM daily.');
}

// Auto-start if run as standalone process
if (require.main === module) {
  (async () => {
    await connectToDatabase();
    await startSweepWorker();
  })();
}
