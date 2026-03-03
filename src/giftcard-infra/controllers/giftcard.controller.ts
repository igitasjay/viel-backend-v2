import { Request, Response } from 'express';
import * as giftService from '@/giftcard-infra/services/giftcard.service';
import * as countryService from '@/services/country.service';
import { asyncHandler } from '@/utils/async-handler.util';

import User from '@/models/user.model';
import { ApiError } from '@/utils/api-error.util';

import config from '@/config/config';

export const listCountries = asyncHandler(
  async (_req: Request, res: Response) => {
    let countries = await countryService.getAllCountriesWithGiftCards();
    res.json({ success: true, data: countries });
  },
);

export const listGiftCardsByCountry = asyncHandler(
  async (req: Request, res: Response) => {
    const { country } = req.query;
    let giftcards = await giftService.getGiftCardsByCountry(
      country as string,
    );
    if (!config.SHOW_TEST_ASSETS) {
      giftcards = giftcards.filter(g => !g.name.startsWith('TEST_'));
    }
    res.json({ success: true, data: giftcards });
  },
);

export const buyGiftCard = asyncHandler(
  async (req: Request, res: Response) => {
    const { giftCardId, amount, quantity, email } = req.body;

    if (!giftCardId || !amount || !quantity || !email) {
      throw new ApiError(400, 'Missing required purchase fields');
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const fullname = `${user.firstname} ${user.lastname}`;

    const purchase = await giftService.purchaseGiftCard(
      req.userId?.toString() as string,
      fullname,
      user.email,
      giftCardId,
      Number(amount),
      Number(quantity),
      email,
    );

    res.status(201).json({
      success: true,
      message: 'Gift card purchase request submitted successfully',
      data: purchase,
    });
  },
);
