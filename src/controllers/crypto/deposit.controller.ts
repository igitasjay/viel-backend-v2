// src/controllers/deposit.controller.ts
import { Request, Response } from 'express';
import DepositAddress from '@/models/deposit-address.model';
import CryptoAsset from '@/models/crypto.model';
import { deriveEVMAddress } from '@/services/hd-wallet.service';
import { getNextDepositIndex } from '@/services/index.service';
import { fetchLiveRate } from '@/lib/twelve-data';
import { logger } from '@/lib/winston';

export const requestDepositAddress = async (req: Request, res: Response) => {
  const { coin, network } = req.query;
  const userId = (req as any).user.id; // set by authenticate middleware

  if (!coin || !network) {
    return res
      .status(400)
      .json({ code: 'MISSING_PARAMS', message: 'coin & network required' });
  }

  const upperCoin = coin.toString().toUpperCase();
  const upperNet = network.toString().toUpperCase();

  // 1. Verify the coin/network exists & is enabled
  const asset = await CryptoAsset.findOne({
    code: upperCoin,
    status: 1,
    'networks.code': upperNet,
    'networks.enabled': true,
  });

  if (!asset) {
    return res
      .status(404)
      .json({ code: 'NOT_SUPPORTED', message: 'Coin/network not available' });
  }

  const net = asset.networks.find((n) => n.code === upperNet && n.enabled);
  if (!net) {
    return res
      .status(404)
      .json({ code: 'NETWORK_DISABLED', message: 'Network disabled' });
  }

  // 2. Get next index for this network
  const index = await getNextDepositIndex(upperNet);

  // 3. Derive address
  const { address, path } = deriveEVMAddress(upperNet, index);

  // 4. Save DB record
  const deposit = await DepositAddress.create({
    user: userId,
    coin: upperCoin,
    network: upperNet,
    address,
    path,
    index,
    status: 'active',
  });

  // 5. Live rate for UI
  const live = await fetchLiveRate(upperCoin);
  const sellingRate = live?.ngn?.toFixed(2) || asset.naira_rate;

  res.status(200).json({
    message: 'Deposit address generated',
    data: {
      coin: upperCoin,
      network: upperNet,
      walletAddress: address,
      qrCodeString: `ethereum:${address}`, // works for all EVM chains
      minDeposit: net.minimum,
      fee: net.fee,
      feeType: net.feeType,
      sellingRate,
      expiresIn: '24h', // optional – you can add TTL logic later
    },
  });
};
