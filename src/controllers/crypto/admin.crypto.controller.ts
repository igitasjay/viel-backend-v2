// src/controllers/crypto/admin.crypto.controller.ts
import CryptoAsset from '@/models/crypto.model';
import { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import { body, param, validationResult } from 'express-validator';

const adminValidation = [
  body('name').trim().notEmpty(),
  body('code').isLength({ min: 2, max: 10 }).toUpperCase(),
  body('icon').isURL(),
  body('networks').isArray({ min: 1 }),
  body('networks.*.walletAddress').notEmpty(),
  body('networks.*.enabled').isBoolean(),
];

export const createCrypto = [
  ...adminValidation,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const data = req.body;
      const exists = await CryptoAsset.exists({ code: data.code });
      if (exists) {
        res
          .status(400)
          .json({ code: 'Duplicate', message: 'Coin code exists.' });
        return;
      }

      const asset = await CryptoAsset.create(data);
      logger.info('Crypto asset created by admin', {
        id: asset.id,
        code: asset.code,
      });
      res.status(201).json({ message: 'Crypto added.', data: asset });
    } catch (error) {
      logger.error('Admin create crypto failed:', error);
      res
        .status(500)
        .json({ code: 'ServerError', message: 'Creation failed.' });
    }
  },
];

export const updateCrypto = [
  param('id').isNumeric(),
  ...adminValidation,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { id } = req.params;
      const updated = await CryptoAsset.findOneAndUpdate(
        { id: parseInt(id) },
        req.body,
        { new: true },
      );

      if (!updated) {
        res
          .status(404)
          .json({ code: 'NotFound', message: 'Crypto not found.' });
        return;
      }

      logger.info('Crypto updated by admin', { id, code: updated.code });
      res.status(200).json({ message: 'Updated.', data: updated });
    } catch (error) {
      logger.error('Admin update failed:', error);
      res.status(500).json({ code: 'ServerError', message: 'Update failed.' });
    }
  },
];

export const deleteCrypto = [
  param('id').isNumeric(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await CryptoAsset.findOneAndUpdate(
        { id: parseInt(id) },
        { status: 0 },
        { new: true },
      );

      if (!deleted) {
        res.status(404).json({ code: 'NotFound', message: 'Not found.' });
        return;
      }

      logger.info('Crypto soft-deleted by admin', { id });
      res.status(200).json({ message: 'Deleted.' });
    } catch (error) {
      res.status(500).json({ code: 'ServerError', message: 'Delete failed.' });
    }
  },
];
