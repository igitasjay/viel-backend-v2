import { Request, Response } from 'express';
import * as sellService from '@/giftcard-infra/services/giftcard-sell.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { NotificationService } from '@/services/notification.service';
import { UserService, VolumeType } from '@/services/user.service';
import { ApiError } from '@/utils/api-error.util';
import mongoose from 'mongoose';

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
  const id = req.query.brandId as string;
  const { name, iso, currencySymbol, ranges } = req.body;

  if (!name || !iso || !currencySymbol) {
    return res.status(400).json({ success: false, message: 'name, iso, and currencySymbol are required' });
  }

  if (ranges && Array.isArray(ranges)) {
    for (const r of ranges) {
      if (!r.range) {
         return res.status(400).json({ success: false, message: 'Each range must have a name (range).' });
      }
    }
  }

  const updated = await sellService.pushCountry(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Brand not found' });
  }
  res.json({ success: true, data: updated });
});

export const addRange = asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.brandId as string;
  const iso = req.query.countryIso as string;
  const { range, types } = req.body;

  if (!range) {
    return res.status(400).json({ success: false, message: 'Range name is required.' });
  }

  const updated = await sellService.pushRange(id, iso, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Brand or country not found' });
  }
  res.json({ success: true, data: updated });
});

export const addType = asyncHandler(async (req: Request, res: Response) => {
  const { brandId, countryIso, rangeId } = req.query as { brandId: string; countryIso: string; rangeId: string };
  const updated = await sellService.pushType(brandId, countryIso, rangeId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Brand, country, or range not found' });
  }
  res.json({ success: true, data: updated });
});

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await sellService.getAllBrands();
  res.json({ success: true, data: brands });
});

export const updateSale = asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.saleId as string;
  const { status, adminComment } = req.body;
  const updated = await sellService.updateSaleStatus(id, status, adminComment);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Sale not found' });
  }

  // Trigger push & email notification 
  if (status === 'completed' || status === 'declined' || status === 'approved' || status === 'rejected') {
    let normalizedStatus: 'approved' | 'rejected' | 'completed' | 'declined' = status;
    if (status === 'completed') normalizedStatus = 'approved';
    if (status === 'declined') normalizedStatus = 'rejected';

    await NotificationService.sendGiftCardStatusNotification(
      updated.userId.toString(),
      'sell',
      normalizedStatus,
      updated.totalInNaira,
      'NGN',
      adminComment
    );
  }

  res.json({ success: true, data: updated });
});

export const approveSale = asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.saleId as string;

  if (!id) {
    throw new ApiError(400, 'saleId query parameter is required');
  }

  const sale = await sellService.getSaleById(id);
  if (!sale) {
    return res.status(404).json({ success: false, message: 'Sale not found' });
  }

  if (sale.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Sale is already completed' });
  }

  if (sale.status === 'declined') {
    return res.status(400).json({ success: false, message: 'Cannot approve a declined sale' });
  }

  // Wrap status update + volume update in a session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updated = await sellService.updateSaleStatus(id, 'completed');
    if (!updated) {
      throw new ApiError(500, 'Failed to update sale status');
    }

    // Update User Trading Volume inside session
    await UserService.updateUserVolume(
      updated.userId.toString(),
      String(updated.totalInNaira),
      VolumeType.SELL,
      session,
    );

    await session.commitTransaction();

    // Trigger push & email notification (outside session, fire-and-forget)
    await NotificationService.sendGiftCardStatusNotification(
      updated.userId.toString(),
      'sell',
      'approved',
      updated.totalInNaira,
      'NGN'
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const listSales = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const sales = await sellService.getSalesByStatus(status as string);
  res.json({ success: true, data: sales });
});
