import { Request, Response } from 'express';
import { CryptoBuyService } from '../services/crypto-buy.service';
import { getQuoteSchema, executeBuySchema, addWhitelistSchema } from '../types/crypto.dto';

export class CryptoBuyController {
  static async getQuote(req: Request, res: Response) {
    try {
      const data = getQuoteSchema.parse(req.body);
      const userId = (req as any).user?.id || (req as any).user?._id;
      
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const quote = await CryptoBuyService.getQuote(userId, data);
      res.status(200).json({ status: true, data: quote });
    } catch (error: any) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  static async executeBuy(req: Request, res: Response) {
    try {
      const data = executeBuySchema.parse(req.body);
      const userId = (req as any).user?.id || (req as any).user?._id;
      
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const result = await CryptoBuyService.executeBuy(userId, data);
      res.status(200).json({ status: true, data: result });
    } catch (error: any) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  static async addWhitelist(req: Request, res: Response) {
    try {
      const data = addWhitelistSchema.parse(req.body);
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const whitelist = await CryptoBuyService.addWhitelist(userId, data);
      res.status(201).json({ status: true, data: whitelist });
    } catch (error: any) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  static async getWhitelist(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized' });

      const whitelist = await CryptoBuyService.getWhitelist(userId);
      res.status(200).json({ status: true, data: whitelist });
    } catch (error: any) {
      res.status(400).json({ status: false, message: error.message });
    }
  }
}
