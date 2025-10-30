// src/services/hd-wallet.service.ts
import { ethers } from 'ethers';
import { logger } from '@/lib/winston';
import config from '@/config';

/**
 * BIP-44 coin types for the EVM chains we support.
 * All EVM chains share the same coin type (60) because they are Ethereum-compatible.
 */
const EVM_COIN_TYPE = 60; // m/44'/60'/account'/change/index

/**
 * In-memory cache of the master HD node.
 * Loaded once at startup – never exposed outside this file.
 */
let masterNode: ethers.HDNodeWallet | null = null;

function getMasterNode(): ethers.HDNodeWallet {
  if (masterNode) return masterNode;

  const mnemonic = process.env.HD_MASTER_MNEMONIC?.trim();
  const passphrase = process.env.HD_PASSPHRASE?.trim() ?? '';

  if (!mnemonic) {
    logger.error('HD_MASTER_MNEMONIC is not set in .env');
    throw new Error('HD wallet seed missing');
  }

  try {
    masterNode = ethers.HDNodeWallet.fromPhrase(mnemonic, passphrase);
    logger.info('HD master node loaded');
    return masterNode;
  } catch (err) {
    logger.error('Invalid HD mnemonic', err);
    throw new Error('Failed to load HD wallet');
  }
}

/**
 * Derive a **deposit address** for a given EVM network and index.
 *
 * @param network   Upper-case network code (e.g. "ERC20", "BSC", "POLYGON")
 * @param index     Sequential index (0,1,2…) – stored in DB
 * @returns         { address, path }
 */
export function deriveEVMAddress(
  network: string,
  index: number,
): { address: string; path: string } {
  const normalized = network.toUpperCase();

  // All EVM chains use the same derivation path (BIP-44)
  const path = `m/44'/${EVM_COIN_TYPE}'/0'/0/${index}`;
  const child = getMasterNode().derivePath(path);

  return {
    address: child.address,
    path,
  };
}

/**
 * OPTIONAL: Sign a raw transaction (used for sweeping / withdrawals)
 */
export function getSignerForIndex(index: number): ethers.Wallet {
  const path = `m/44'/${EVM_COIN_TYPE}'/0'/0/${index}`;
  const child = getMasterNode().derivePath(path);

  // HDNodeWallet is NOT a Wallet → extract privateKey and create a real Wallet
  return new ethers.Wallet(child.privateKey, getProvider());
}

/**
 * Helper – a single ethers provider (Alchemy) shared across the app
 */
let sharedProvider: ethers.JsonRpcProvider | null = null;
export function getProvider(): ethers.JsonRpcProvider {
  if (sharedProvider) return sharedProvider;

  const url = `https://eth-mainnet.g.alchemy.com/v2/${config.ALCHEMY_API_KEY}`;
  sharedProvider = new ethers.JsonRpcProvider(url);
  return sharedProvider;
}
