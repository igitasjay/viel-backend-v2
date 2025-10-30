// src/controllers/crypto/user.crypto.controller.ts
import CryptoAsset from '@/models/crypto.model';
import { Request, Response } from 'express';
import { fetchLiveRate } from '@/lib/twelve-data';
import { logger } from '@/lib/winston';

export const getSupportedCoins = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const assets = await CryptoAsset.find({ status: 1 }).lean();

    const enriched = await Promise.all(
      assets.map(async (asset) => {
        const live = await fetchLiveRate(asset.code);
        const naira_rate = live?.ngn?.toFixed(2) || asset.naira_rate;

        return {
          ...asset,
          naira_rate,
          networks: asset.networks
            .filter((n) => n.enabled)
            .map((n) => ({
              id: n.id,
              name: n.name,
              code: n.code,
              walletAddress: n.walletAddress,
              qrCodeString: n.walletAddress, // Static
              sellingRate: naira_rate,
              minDeposit: n.minimum,
              fee: n.fee,
              feeType: n.feeType,
            })),
        };
      }),
    );

    res.status(200).json({
      message: 'Supported cryptocurrencies fetched.',
      data: enriched,
    });
  } catch (error) {
    logger.error('Error fetching crypto list:', error);
    res.status(500).json({
      code: 'ServerError',
      message: 'Failed to fetch supported coins.',
    });
  }
};

export const getDepositWallet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { coin, network } = req.query;

  if (!coin || !network) {
    res.status(400).json({
      code: 'ValidationError',
      message: 'Both coin and network are required.',
    });
    return;
  }

  try {
    const asset = await CryptoAsset.findOne({
      code: coin.toString().toUpperCase(),
      status: 1,
      'networks.code': network.toString().toUpperCase(),
      'networks.enabled': true,
    });

    if (!asset) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Coin or network not supported.',
      });
      return;
    }

    const net = asset.networks.find(
      (n) => n.code === network.toString().toUpperCase() && n.enabled,
    );

    if (!net) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Network not enabled.',
      });
      return;
    }

    res.status(200).json({
      message: 'Deposit wallet retrieved.',
      data: {
        coin: asset.code,
        network: net.code,
        walletAddress: net.walletAddress,
        qrCodeString: net.walletAddress,
        minDeposit: net.minimum,
        sellingRate:
          (await fetchLiveRate(asset.code))?.ngn?.toFixed(2) ||
          asset.naira_rate,
      },
    });
  } catch (error) {
    logger.error('Error fetching wallet:', error);
    res.status(500).json({
      code: 'ServerError',
      message: 'Failed to retrieve wallet.',
    });
  }
};
