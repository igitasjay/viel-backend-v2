import { Request, Response } from 'express';
import { CryptoSellService } from '../services/crypto-sell.service';
import { generateWalletSchema } from '../types/crypto.dto';

export class CryptoSellController {
  static async generateWallet(req: Request, res: Response) {
    try {
      const data = generateWalletSchema.parse(req.body);
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const wallet = await CryptoSellService.generateWallet(userId, data);
      res.status(200).json({ status: true, data: wallet });
    } catch (error: any) {
      console.log(error)
      res.status(400).json({ status: false, message: error.message });
    }
  }

  static async getWallets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const wallets = await CryptoSellService.getWallets(userId);
      res.status(200).json({ status: true, data: wallets });
    } catch (error: any) {
      res.status(400).json({ status: false, message: error.message });
    }
  }
}
