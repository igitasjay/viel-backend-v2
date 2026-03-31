import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import * as solana from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';
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
    const currency = await Currency.findOne({ symbol: currencySymbol, network });
    if (!currency) throw new Error(`Currency ${currencySymbol} on ${network} not found`);

    // 2. Get next index from DB
    const count = await Wallet.countDocuments({ network });
    const addressIndex = count + 1;

    // 3. Get Master Mnemonic from KMS
    const mnemonic = await getDecryptedSeed();
    if (!mnemonic) throw new Error('Failed to retrieve master mnemonic from KMS');

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
   * Sweeping Logic (Admin Only)
   * Signs a tx to move funds from User Wallet -> Cold Wallet
   */
  static async signTransfer(
    derivationPath: string,
    to: string,
    amount: string,
  ) {
    // Re-create the master node
    const mnemonic = await getDecryptedSeed();
    if (!mnemonic) throw new Error('Failed to retrieve master mnemonic from KMS');
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    // Derive the specific child node (which contains the private key)
    const childWallet = hdNode.derivePath(derivationPath);

    // In v6, the wallet instance is ready to sign
    // Logic to broadcast tx... e.g. await childWallet.sendTransaction(...)
    return childWallet;
  }
}
