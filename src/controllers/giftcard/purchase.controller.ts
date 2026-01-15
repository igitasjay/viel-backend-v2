import { Request, Response } from 'express';
import User from '@/models/user.model';
import * as purchaseService from '@/services/giftcard.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import { purchaseEmailHtml } from '@/lib/email-temeplate';

export const purchaseGiftCard = asyncHandler(
  async (req: Request, res: Response) => {
    const { giftCardId, amount, quantity, email } = req.body;
    const userId = req.userId?.toString();

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const fullName = `${user.firstname} ${user.lastname}`;

    const purchase = await purchaseService.purchaseGiftCard(
      userId,
      fullName,
      user.email,
      giftCardId,
      Number(amount),
      Number(quantity),
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
