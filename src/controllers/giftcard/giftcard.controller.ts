import { Request, Response } from 'express';
import * as giftService from '@/services/giftcard.service';
import * as countryService from '@/services/country.service';
import { asyncHandler } from '@/utils/async-handler.util';

export const listCountries = asyncHandler(
  async (_req: Request, res: Response) => {
    const countries = await countryService.getAllCountries();
    res.json({ success: true, data: countries });
  },
);

export const listGiftCardsByCountry = asyncHandler(
  async (req: Request, res: Response) => {
    const giftcards = await giftService.getGiftCardsByCountry(
      req.params.countryId,
    );
    res.json({ success: true, data: giftcards });
  },
);
