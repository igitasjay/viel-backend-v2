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
    for (const c of countries) {
      if (!c.ranges || !Array.isArray(c.ranges) || c.ranges.length === 0) {
        return res.status(400).json({ success: false, message: `Country ${c.name} must have at least one range.` });
      }
      for (const r of c.ranges) {
        if (!r.types || !Array.isArray(r.types) || r.types.length === 0) {
          return res.status(400).json({ success: false, message: `Range ${r.range} in ${c.name} must have at least one type.` });
        }
      }
    }
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
  const { id } = req.params;
  const { name, iso, currencySymbol, ranges } = req.body;

  if (!name || !iso || !currencySymbol) {
    return res.status(400).json({ success: false, message: 'name, iso, and currencySymbol are required' });
  }

  if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one range is required when adding a country.' });
  }

  for (const r of ranges) {
    if (!r.range || !r.types || !Array.isArray(r.types) || r.types.length === 0) {
      return res.status(400).json({ success: false, message: 'Each range must have a name (range) and at least one type.' });
    }
  }

  const updated = await sellService.pushCountry(id, req.body);
  res.json({ success: true, data: updated });
});

export const addRange = asyncHandler(async (req: Request, res: Response) => {
  const { id, iso } = req.params;
  const { range, types } = req.body;

  if (!range || !types || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ success: false, message: 'Range and at least one type are required.' });
  }

  const updated = await sellService.pushRange(id, iso, req.body);
  res.json({ success: true, data: updated });
});

export const addType = asyncHandler(async (req: Request, res: Response) => {
  const { id, iso, range } = req.params;
  const updated = await sellService.pushType(id, iso, range, req.body);
  res.json({ success: true, data: updated });
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
