import { Request, Response } from 'express';
import * as sellService from '@/services/giftcard-sell.service';
import { asyncHandler } from '@/utils/async-handler.util';

export const addBrand = asyncHandler(async (req: Request, res: Response) => {
  const { name, currencySymbol } = req.body;
  let { countries } = req.body;

  if (!req.file && !req.body.logoUrl) {
    return res.status(400).json({ success: false, message: 'Brand logo is required' });
  }

  // Handle nested data parsing from multipart/form-data
  if (typeof countries === 'string') {
    try {
      countries = JSON.parse(countries);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid countries data format' });
    }
  }

  const brand = await sellService.createBrand({
    name,
    currencySymbol,
    countries,
    logoUrl: req.file ? req.file.path : req.body.logoUrl,
    isActive: true,
  });

  res.status(201).json({ success: true, data: brand });
});

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await sellService.getAllBrands();
  res.json({ success: true, data: brands });
});

export const updateSale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminComment } = req.body;
  const updated = await sellService.updateSaleStatus(id, status, adminComment);
  res.json({ success: true, data: updated });
});

export const listSales = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const sales = await sellService.getSalesByStatus(status as string);
  res.json({ success: true, data: sales });
});
