// services/depositScanner.ts
import { ethers, JsonRpcProvider } from 'ethers';
import { Deposit } from '../models/deposit';
import { DepositAddress } from '../models/deposit-address';
import config from '@/config/config';

// config
const RPC_URL = config.RPC_URL || '';
const REQUIRED_CONFIRMATIONS = Number(process.env.REQUIRED_CONFIRMATIONS || 3);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5000);

const provider = new JsonRpcProvider(RPC_URL);

// in-memory last processed map (persist in real app)
const lastProcessed: Record<string, number> = {};

async function getLastProcessedBlock(chain: string) {
  return lastProcessed[chain] ?? (await provider.getBlockNumber()) - 1;
}
async function setLastProcessedBlock(chain: string, n: number) {
  lastProcessed[chain] = n;
  // persist to DB/config store in real app
}

async function processBlock(chain: string, blockNumber: number) {
  // get block with full txs
  const block = await provider.getBlock(blockNumber, true);
  if (!block) return;

  // map of deposit addresses to userId
  const addresses = await DepositAddress.find({ chain }).lean();
  const addrSet = new Set(addresses.map((a) => a.address.toLowerCase()));

  // iterate txs
  // iterate txs (hashes only)
  for (const txHash of block.transactions as string[]) {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) continue;

    const toLower = tx.to.toLowerCase();
    if (!addrSet.has(toLower)) continue;

    try {
      await Deposit.updateOne(
        { txHash },
        {
          $setOnInsert: {
            address: tx.to,
            txHash,
            from: tx.from ?? null,
            to: tx.to,
            chain,
            tokenAddress: null,
            amountWei: tx.value.toString(),
            blockNumber: tx.blockNumber!,
            confirmations: 1,
            status: 'pending',
            firstSeenAt: new Date(),
            lastUpdatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch {}
  }

  // ERC-20 transfers
  const transferTopic = ethers.id('Transfer(address,address,uint256)');

  for (const a of addresses) {
    const filter = {
      fromBlock: blockNumber,
      toBlock: blockNumber,
      topics: [transferTopic, null, ethers.zeroPadValue(a.address, 32)],
    };

    try {
      const logs = await provider.getLogs(filter);

      for (const log of logs) {
        const amount = ethers.toBigInt(log.data).toString();
        const tokenAddress = log.address;
        const txHash = log.transactionHash;

        await Deposit.updateOne(
          { txHash },
          {
            $setOnInsert: {
              address: a.address,
              txHash,
              from: null,
              to: a.address,
              chain,
              tokenAddress,
              amountWei: amount,
              blockNumber: log.blockNumber,
              confirmations: 1,
              status: 'pending',
              firstSeenAt: new Date(),
              lastUpdatedAt: new Date(),
            },
          },
          { upsert: true },
        );
      }
    } catch (e) {
      console.error('token log query failed', e);
    }
  }
}

async function updateConfirmations(chain: string, currentBlock: number) {
  const pending = await Deposit.find({ chain, status: 'pending' });
  for (const d of pending) {
    if (!d.blockNumber) continue;
    const conf = currentBlock - d.blockNumber + 1;
    if (conf !== d.confirmations) {
      d.confirmations = conf;
      d.lastUpdatedAt = new Date();
      // If confirmations reached threshold => mark confirmed & call credit
      if (conf >= REQUIRED_CONFIRMATIONS) {
        d.status = 'confirmed';
        await d.save();
        await creditUser(d);
      } else {
        await d.save();
      }
    }
  }
}

// crediting logic: idempotent; ensure single credit (use DB transaction/locks)
async function creditUser(d: any) {
  // find userId for address
  const addrDoc = await DepositAddress.findOne({
    address: d.address,
    chain: d.chain,
  });
  if (!addrDoc) {
    console.warn('No user mapping for address', d.address);
    return;
  }

  // TODO: ensure idempotent credits: check ledger entries, use unique txHash index
  // Example: mark as credited
  await Deposit.updateOne(
    { txHash: d.txHash, status: 'confirmed' },
    { $set: { status: 'credited' } },
  );
  // call your internal accounting: add balance to user account
  // await Accounting.credit(addrDoc.userId, d.amountWei, d.tokenAddress)
  console.log(`Credited ${d.amountWei} (wei) to user ${addrDoc.userId}`);
}

export async function startScanner(chain = 'ethereum') {
  // bootstrap last processed
  let last = await getLastProcessedBlock(chain);
  const head = await provider.getBlockNumber();
  if (last < head - 100) last = head - 100; // start near head to avoid huge sync

  await setLastProcessedBlock(chain, last);

  // polling loop
  setInterval(async () => {
    try {
      const current = await provider.getBlockNumber();
      // process blocks one-by-one
      for (let bn = last + 1; bn <= current; bn++) {
        await processBlock(chain, bn);
        await setLastProcessedBlock(chain, bn);
        last = bn;
      }
      // update confirmations for pending deposits
      await updateConfirmations(chain, current);
    } catch (err) {
      console.error('scanner loop error', err);
    }
  }, POLL_INTERVAL_MS);
}
