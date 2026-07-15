import { ethers } from 'ethers';
// @ts-expect-error - bitcoinjs-lib v7 is ESM-only; runtime interop handled by ts-node
import * as bitcoin from 'bitcoinjs-lib';
import * as solana from '@solana/web3.js';
import * as bip39 from 'bip39';
// @ts-expect-error - tiny-secp256k1 v2 is ESM-only; runtime interop handled by ts-node
import * as ecc from 'tiny-secp256k1';
// @ts-expect-error - bip32 v5 is ESM-only; runtime interop handled by ts-node
import { BIP32Factory } from 'bip32';
import { Wallet } from '../models/wallet.model';
import { Currency } from '../models/currency.model';
import getDecryptedSeed from '../util/google-cloud-kms';

const bip32 = BIP32Factory(ecc);

export class WalletService {
  /**
   * Generates a unique address for a user on a specific chain.
   * Uses BIP-44 path: m/44'/60'/0'/0/index
   */
  static async generateWallet(
    userId: string,
    currencySymbol: string,
    network: string,
  ) {
    // 1. Fetch Currency to get chainFamily
    const currency = await Currency.findOne({
      symbol: currencySymbol,
      network,
    });
    if (!currency)
      throw new Error(`Currency ${currencySymbol} on ${network} not found`);

    // 2. Get next index from DB
    const count = await Wallet.countDocuments({ network });
    const addressIndex = count + 1;

    // 3. Get Master Mnemonic
    const mnemonic = await this.getMasterMnemonic();

    let address = '';
    let derivationPath = '';

    // 4. Derive Address based on chainFamily
    if (currency.chainFamily === 'EVM' || !currency.chainFamily) {
      // Default to EVM
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, 'm');
      derivationPath = `m/44'/60'/0'/0/${addressIndex}`;
      const derivedWallet = hdNode.derivePath(derivationPath);
      address = derivedWallet.address;
    } else if (currency.chainFamily === 'BITCOIN') {
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const root = bip32.fromSeed(seed);
      derivationPath = `m/44'/0'/0'/0/${addressIndex}`;
      const child = root.derivePath(derivationPath);
      const { address: btcAddress } = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(child.publicKey),
      });
      address = btcAddress!;
    } else if (currency.chainFamily === 'SOLANA') {
      const seed = await bip39.mnemonicToSeed(mnemonic);
      derivationPath = `m/44'/501'/0'/0'`; // Solana often uses a different scheme, but BIP44 works
      // Note: Solana uses Ed25519, ethers doesn't support it for wallets, but @solana/web3.js + bip39 does
      const derivedSeed = await bip39.mnemonicToSeed(mnemonic);
      const keypair = solana.Keypair.fromSeed(derivedSeed.slice(0, 32)); // Simplified for now
      address = keypair.publicKey.toBase58();
    }

    // 5. Save to DB
    const newWallet = await Wallet.create({
      userId,
      currency: currencySymbol,
      network,
      address,
      derivationPath,
    });

    return newWallet;
  }

  /**
   * Helper to resolve master mnemonic from KMS or Environment
   */
  private static async getMasterMnemonic(): Promise<string> {
    try {
      // 1. Try KMS first (Production)
      const mnemonic = await getDecryptedSeed();
      if (mnemonic) return mnemonic;
    } catch (error) {
      console.warn(
        'KMS decryption failed, falling back to environment variable',
      );
    }

    // 2. Fallback to ENV (Development)
    const envMnemonic =
      process.env.MASTER_MNEMONIC || process.env.HD_MASTER_MNEMONIC;
    if (!envMnemonic) {
      throw new Error('Master mnemonic not found in KMS or ENV');
    }
    return envMnemonic;
  }

  /**
   * Returns a provider for the EVM network
   */
  static getEVMProvider(network?: string) {
    const config = require('@/config/config').default;
    const rpcUrl = network ? config.getNetworkRPC(network) : config.ALCHEMY_RPC_URL;
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Sweeping Logic (Admin Only)
   * Signs a tx to move funds from User Wallet -> Cold Wallet
   */
  static async getSigner(derivationPath: string, network?: string): Promise<ethers.Wallet> {
    const mnemonic = await this.getMasterMnemonic();
    // Initialize at the root 'm' to allow absolute path derivation
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, 'm');
    const childNode = hdNode.derivePath(derivationPath);

    // Return a connected wallet
    return new ethers.Wallet(childNode.privateKey, this.getEVMProvider(network));
  }
}
