import { Request, Response } from 'express';
import * as sellService from '@/services/giftcard-sell.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { ApiError } from '@/utils/api-error.util';
import GiftCardCategory from '@/models/giftcard-category.model';

export const getSellBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await sellService.getAllBrands();
  res.json({ success: true, data: brands });
});

export const getSellCategories = asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.query;
  if (!brandId) throw new ApiError(400, 'brandId is required');
  const categories = await sellService.getCategoriesByBrand(brandId as string);
  res.json({ success: true, data: categories });
});

export const sellGiftCard = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, amount, quantity, comment } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!categoryId || !amount || !quantity) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one proof image is required');
  }

  const category = await GiftCardCategory.findById(categoryId);
  if (!category || !category.isActive) {
    throw new ApiError(404, 'Selected category not found or inactive');
  }

  if (!category.denominations.includes(Number(amount))) {
    throw new ApiError(400, `Invalid amount. Supported amounts: ${category.denominations.join(', ')}`);
  }

  const totalInNaira = Number(amount) * Number(quantity) * category.rate;
  const imageUrls = files.map(file => file.path); // Assuming Cloudinary path

  const sale = await sellService.createSaleEntry({
    userId: req.userId,
    categoryId,
    amount: Number(amount),
    quantity: Number(quantity),
    totalInNaira,
    images: imageUrls,
    comment,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Sell request submitted successfully',
    data: sale,
  });
});
