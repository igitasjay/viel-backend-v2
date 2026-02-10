import { Request, Response } from 'express';
import * as sellService from '@/services/giftcard-sell.service';
import { asyncHandler } from '@/utils/async-handler.util';

export const addBrand = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  let { countries } = req.body;

  if (!req.file && !req.body.logoUrl) {
    return res.status(400).json({ success: false, message: 'Brand logo is required' });
  }

  if (typeof countries === 'string') {
    try {
      countries = JSON.parse(countries);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid countries data format. Expected JSON.' });
    }
  }

  // Final validation if countries are provided
  if (countries && Array.isArray(countries)) {
    // We allow countries without ranges, and ranges without types now.
    // So no strict validation here for nested children emptiness.
  }

  const brand = await sellService.createBrand({
    name,
    countries: countries || [],
    logoUrl: req.file ? req.file.path : req.body.logoUrl,
    isActive: true,
  });

  res.status(201).json({ success: true, data: brand });
});

export const addCountry = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, iso, currencySymbol, ranges } = req.body;

  if (!name || !iso || !currencySymbol) {
    return res.status(400).json({ success: false, message: 'name, iso, and currencySymbol are required' });
  }

  // Ranges are now optional during creation
  // if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
  //   return res.status(400).json({ success: false, message: 'At least one range is required when adding a country.' });
  // }

  if (ranges && Array.isArray(ranges)) {
    for (const r of ranges) {
      // If ranges are provided, they must have a name, but types can be empty
      if (!r.range) {
         return res.status(400).json({ success: false, message: 'Each range must have a name (range).' });
      }
    }
  }

  const updated = await sellService.pushCountry(id, req.body);
  res.json({ success: true, data: updated });
});

export const addRange = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const iso = req.params.iso as string;
  const { range, types } = req.body;

  if (!range) {
    return res.status(400).json({ success: false, message: 'Range name is required.' });
  }

  // Types are now optional
  // if (!types || !Array.isArray(types) || types.length === 0) {
  //   return res.status(400).json({ success: false, message: 'Range and at least one type are required.' });
  // }

  const updated = await sellService.pushRange(id, iso, req.body);
  res.json({ success: true, data: updated });
});

export const addType = asyncHandler(async (req: Request, res: Response) => {
  const { id, iso, range } = req.params as { id: string; iso: string; range: string };
  const updated = await sellService.pushType(id, iso, range, req.body);
  res.json({ success: true, data: updated });
});

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await sellService.getAllBrands();
  res.json({ success: true, data: brands });
});

export const updateSale = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, adminComment } = req.body;
  const updated = await sellService.updateSaleStatus(id, status, adminComment);
  res.json({ success: true, data: updated });
});

export const listSales = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const sales = await sellService.getSalesByStatus(status as string);
  res.json({ success: true, data: sales });
});
