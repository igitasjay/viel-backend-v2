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
/**
 * Performs the actual sweep logic.
 * Can be called by the scheduler or manually for testing.
 */
export async function runSweep() {
  logger.info('Initiating crypto sweep...');
  
  try {
    // 1. Fetch all EVM-based wallets (including common DB name variations)
    const wallets = await Wallet.find({
      network: { 
        $in: [
          'ETH', 'SEPOLIA', 'ERC20', 'BSC', 'POLYGON', 
          'Ethereum (ERC20)', 'BSC (BEP20)', 'Polygon (MATIC)', 'Sepolia Testnet'
        ] 
      }
    });

    logger.info(`Checking ${wallets.length} wallets for sweepable balances...`);

    const thresholdWei = ethers.parseEther(config.SWEEP_THRESHOLD_ETH);
    const destAddress = config.COLD_WALLET_EVM;

    if (!destAddress) {
      throw new Error('COLD_WALLET_EVM not configured in environment');
    }

    for (const walletRecord of wallets) {
      // Skip the cold wallet itself
      if (walletRecord.address.toLowerCase() === destAddress.toLowerCase()) {
        continue;
      }

      try {
        // Use network-aware provider
        const provider = WalletService.getEVMProvider(walletRecord.network);
        const balance = await provider.getBalance(walletRecord.address);

        if (balance >= thresholdWei) {
          logger.info(`Threshold met for ${walletRecord.address} on ${walletRecord.network}: ${ethers.formatEther(balance)} ETH. Initiating sweep...`);
          
          const signer = await WalletService.getSigner(walletRecord.derivationPath, walletRecord.network);
          const signerAddress = await signer.getAddress();

          if (signerAddress.toLowerCase() !== walletRecord.address.toLowerCase()) {
            throw new Error(`Signer address mismatch! Derived: ${signerAddress}, DB Record: ${walletRecord.address}. Check your MASTER_MNEMONIC.`);
          }
          
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

          logger.info(`Sending ${ethers.formatEther(amountToSweep)} ETH to cold wallet ${destAddress}`);

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
        logger.error(`Failed to sweep wallet ${walletRecord.address} (${walletRecord.network}): ${err.message}`);
      }
    }

    logger.info('Sweep cycle completed.');
  } catch (error: any) {
    logger.error('Critical error during sweep:', error.message);
  }
}

/**
 * Automates the movement of funds from user deposit addresses to the platform cold wallet.
 */
export async function startSweepWorker() {
  console.log('--- Crypto Sweep Worker Initializing ---');
  
  // Schedule: 12:00 PM every day
  cron.schedule('0 12 * * *', async () => {
    logger.info('Starting scheduled daily sweep...');
    await runSweep();
  });

  // Check for immediate run flag (useful for testing)
  if (process.env.IMMEDIATE_SWEEP === 'true') {
    logger.info('IMMEDIATE_SWEEP flag detected. Running sweep now...');
    runSweep();
  }

  console.log('Crypto Sweep Worker Scheduled for 12:00 PM daily.');
}

// Auto-start if run as standalone process
if (require.main === module) {
  (async () => {
    await connectToDatabase();
    await startSweepWorker();
  })();
}
