import { Request, Response } from 'express';
import * as purchaseService from '@/services/giftcard.service'; // purchase function lives here
import { asyncHandler } from '@/utils/async-handler.util';
// import { sendPurchaseEmail } from '@/lib/email';
import { purchaseEmailHtml } from '@/lib/email-temeplate';

export const purchaseGiftCard = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId || 'anonymous'; // assume auth middleware
    const { giftCardId, amount, quantity, email } = req.body;

    const purchase = await purchaseService.purchaseGiftCard(
      userId,
      giftCardId,
      amount,
      quantity,
      email,
    );

    // send email (fire-and-forget)
    const html = purchaseEmailHtml(purchase);
    // sendPurchaseEmail(
    //   email,
    //   `Your Gift Card Purchase - ${purchase._id}`,
    //   html,
    // ).catch(console.error);

    res.status(201).json({ success: true, data: purchase });
  },
);
