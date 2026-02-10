import { Request, Response } from 'express';
import * as countryService from '@/services/country.service';
import * as giftService from '@/services/giftcard.service';
import { asyncHandler } from '@/utils/async-handler.util';
import { logger } from '@/lib/winston';
import mongoose from 'mongoose';

export const createCountry = asyncHandler(
  async (req: Request, res: Response) => {
    const country = await countryService.createCountry(req.body);
    logger.info('country added successfully', country);
    res.status(201).json({ success: true, data: country });
  },
);

export const createGiftCard = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const {
        country,
        name,
        instruction,
        currency,
        validAmounts: validAmountsRaw,
        minAmount,
        maxAmount,
        availableQty,
        rate,
      } = req.body;

      // ──────── SAFE validAmounts parsing ────────
      let validAmounts: number[] = [];

      if (Array.isArray(validAmountsRaw)) {
        validAmounts = validAmountsRaw
          .map((v: any) => Number(v))
          .filter((n: number) => !isNaN(n) && n > 0);
      } else if (typeof validAmountsRaw === 'string') {
        const trimmed = validAmountsRaw.trim();

        if (trimmed.startsWith('[')) {
          // JSON array string
          try {
            validAmounts = JSON.parse(trimmed)
              .map((v: any) => Number(v))
              .filter((n: number) => !isNaN(n) && n > 0);
          } catch {
            validAmounts = [];
          }
        } else {
          // comma-separated string
          validAmounts = trimmed
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !isNaN(n) && n > 0);
        }
      }
      // ─────────────────────────────────────────────

      const parsed = {
        country: (country || '').toString().trim(),
        name: (name || '').trim(),
        instruction: (instruction || '').trim(),
        currency: (currency || '').trim(),
        validAmounts,
        minAmount: minAmount
          ? Number(minAmount)
          : Math.min(...(validAmounts.length ? validAmounts : [0])),
        maxAmount: maxAmount
          ? Number(maxAmount)
          : Math.max(...(validAmounts.length ? validAmounts : [0])),
        availableQty: Number(availableQty || 0),
        rate: Number(rate || 0),
      };

      const missing: string[] = [];

      if (!parsed.country) missing.push('country');
      if (!parsed.name) missing.push('name');
      if (!parsed.currency) missing.push('currency');
      if (parsed.validAmounts.length === 0) missing.push('validAmounts');

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing or invalid required fields',
          missingFields: missing,
        });
      }

      const giftcard = await giftService.createGiftCard({
        ...parsed,
        imageUrl: req.file.path,
      });

      logger.info('gift card added successfully', giftcard);

      res.status(201).json({ success: true, data: giftcard });
    } catch (err: any) {
      console.error('Gift card creation error:', err);
      res.status(500).json({
        message: 'Error creating gift card',
        error: err?.message || 'Unknown error',
      });
    }
  },
);

export const updateGiftCard = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.query.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid gift card ID' });
    }

    const rawValidAmounts = req.body?.validAmounts;

    let validAmounts: number[] = [];

    if (Array.isArray(rawValidAmounts)) {
      validAmounts = rawValidAmounts
        .map((v: string | number) => Number(v))
        .filter((n: number): n is number => n > 0);
    } else if (typeof rawValidAmounts === 'string' && rawValidAmounts.trim()) {
      const trimmed = rawValidAmounts.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            validAmounts = parsed
              .map((v: any) => Number(v))
              .filter((n: number): n is number => n > 0);
          }
        } catch {
          // ignore
        }
      } else {
        validAmounts = trimmed
          .split(',')
          .map((s: string) => Number(s.trim()))
          .filter((n: number): n is number => n > 0);
      }
    }

    const payload: Partial<{
      country: string;
      name: string;
      instruction: string;
      currency: string;
      validAmounts: number[];
      minAmount: number;
      maxAmount: number;
      availableQty: number;
      rate: number;
      imageUrl: string;
    }> = {
      country: req.body?.country?.toString().trim(),
      name: req.body?.name?.trim(),
      instruction: req.body?.instruction?.trim(),
      currency: req.body?.currency?.trim(),
      validAmounts: validAmounts.length > 0 ? validAmounts : undefined,
      minAmount: req.body?.minAmount ? Number(req.body.minAmount) : undefined,
      maxAmount: req.body?.maxAmount ? Number(req.body.maxAmount) : undefined,
      availableQty: req.body?.availableQty
        ? Number(req.body.availableQty)
        : undefined,
      rate: req.body?.rate ? Number(req.body.rate) : undefined,
    };

    if (req.file) payload.imageUrl = req.file.path;

    // Remove undefined keys
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });

    const updated = await giftService.updateGiftCard(id, payload);

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: 'Gift card not found' });
    }

    res.json({ success: true, data: updated });
  },
);
