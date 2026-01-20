import { Request, Response } from 'express';
import * as sellService from '@/services/giftcard-sell.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import { LedgerService } from '@/crypto-infra/services/ledger.service';
import {
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '@/crypto-infra/models/Ledger';

export const getSellBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await sellService.getAllBrands();
  res.json({ success: true, data: brands });
});

export const sellGiftCard = asyncHandler(async (req: Request, res: Response) => {
  const { brandId, country, range, type, amount, quantity, comment } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!brandId || !country || !range || !type || !amount || !quantity) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one proof image is required');
  }

  const brand = await sellService.getBrandById(brandId);
  if (!brand || !brand.isActive) {
    throw new ApiError(404, 'Brand not found or inactive');
  }

  // Deep validation
  const countryData = brand.countries.find(c => c.name === country);
  if (!countryData) throw new ApiError(400, 'Invalid country for this brand');

  const rangeData = countryData.ranges.find(r => r.range === range);
  if (!rangeData) throw new ApiError(400, 'Invalid range for this country');

  const typeData = rangeData.types.find(t => t.name === type);
  if (!typeData) throw new ApiError(400, 'Invalid type for this range');

  if (!typeData.denominations.includes(Number(amount))) {
    throw new ApiError(400, `Invalid amount. Supported: ${typeData.denominations.join(', ')}`);
  }

  const totalInNaira = Number(amount) * Number(quantity) * typeData.rate;
  const imageUrls = files.map(file => file.path);

  const sale = await sellService.createSaleEntry({
    userId: req.userId,
    brandId,
    selection: {
      country,
      range,
      type,
      rate: typeData.rate,
    },
    amount: Number(amount),
    quantity: Number(quantity),
    totalInNaira,
    images: imageUrls,
    comment,
    status: 'pending',
  });

  // Log to Ledger (Credit Naira - user receives money for selling)
  await LedgerService.creditUser(
    req.userId!.toString(),
    'NGN',
    totalInNaira,
    LedgerType.GIFTCARD_SELL,
    `GCS-${sale._id}`,
    LedgerCategory.GIFTCARD,
    TransactionAction.SELL,
  );

  res.status(201).json({
    success: true,
    message: 'Sell request submitted successfully',
    data: sale,
  });
});
