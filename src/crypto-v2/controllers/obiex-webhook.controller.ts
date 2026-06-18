import { Request, Response } from 'express';
import { CryptoSellService } from '../services/crypto-sell.service';
import { webhookPayloadSchema } from '../types/crypto.dto';

export class ObiexWebhookController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const data = webhookPayloadSchema.parse(req.body);
      
      // Process webhook asynchronously
      CryptoSellService.handleWebhook(data).catch((err) => {
        console.error('Error processing Obiex webhook', err);
      });

      // Acknowledge receipt
      res.status(200).json({ status: true, message: 'Webhook received' });
    } catch (error: any) {
      res.status(400).json({ status: false, message: error.message });
    }
  }
}
