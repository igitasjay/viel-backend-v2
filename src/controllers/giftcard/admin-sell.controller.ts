import { Request, Response } from 'express';
import * as sellService from '@/services/giftcard-sell.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { logger } from '@/lib/winston';

export const addBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await sellService.createBrand(req.body);
  res.status(201).json({ success: true, data: brand });
});

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await sellService.getAllBrands();
  res.json({ success: true, data: brands });
});

export const addCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await sellService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
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
