import { ethers } from 'ethers';
import { Wallet } from '../models/wallet.model';

// WARNING: In production, load this from AWS Secrets Manager / Vault
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC!;

export class WalletService {
  /**
   * Generates a unique address for a user on a specific chain.
   * Uses BIP-44 path: m/44'/60'/0'/0/index
   */
  static async generateWallet(
    userId: string,
    currency: string,
    network: string,
  ) {
    // 1. Get next index from DB
    const count = await Wallet.countDocuments({ network });
    const addressIndex = count + 1;

    // 2. Derive Key (FIXED)
    // We explicitly ask for path "m" to get the Master Node (Depth 0)
    const hdNode = ethers.HDNodeWallet.fromPhrase(
      MASTER_MNEMONIC,
      undefined,
      'm',
    );

    // Now this absolute path works because we are starting from Root
    const derivationPath = `m/44'/60'/0'/0/${addressIndex}`;

    const derivedWallet = hdNode.derivePath(derivationPath);

    // 3. Save to DB
    const newWallet = await Wallet.create({
      userId,
      currency,
      network,
      address: derivedWallet.address,
      derivationPath,
    });

    return newWallet;
  }

  /**
   * Sweeping Logic (Admin Only)
   * Signs a tx to move funds from User Wallet -> Cold Wallet
   */
  static async signTransfer(
    derivationPath: string,
    to: string,
    amount: string,
  ) {
    // Re-create the master node
    const hdNode = ethers.HDNodeWallet.fromPhrase(MASTER_MNEMONIC);
    // Derive the specific child node (which contains the private key)
    const childWallet = hdNode.derivePath(derivationPath);

    // In v6, the wallet instance is ready to sign
    // Logic to broadcast tx... e.g. await childWallet.sendTransaction(...)
    return childWallet;
  }
}
