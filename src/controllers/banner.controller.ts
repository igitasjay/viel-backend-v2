import { Request, Response } from 'express';
import Banner from '@/models/banner.model';
import { asyncHandler } from '@/utils/async-handler.util';
import { logger } from '@/lib/winston';
import cloudinary from '@/config/cloudinary.config';

/**
 * @desc    Upload a new promotion banner
 * @route   POST /api/v1/admin/banners/upload
 * @access  Admin
 */
export const uploadBanner = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Banner image is required',
    });
  }

  const { title, link } = req.body;

  const banner = await Banner.create({
    imageUrl: req.file.path,
    publicId: (req.file as any).filename || (req.file as any).public_id,
    title,
    link,
  });

  logger.info('Promotion banner uploaded successfully', { bannerId: banner._id });

  res.status(201).json({
    success: true,
    message: 'Banner uploaded successfully',
    data: banner,
  });
});

/**
 * @desc    Get all active promotion banners
 * @route   GET /api/v1/banners
 * @access  Public/User
 */
export const getBanners = asyncHandler(async (req: Request, res: Response) => {
  const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: banners,
  });
});

/**
 * @desc    Get all promotion banners (including inactive ones)
 * @route   GET /api/v1/admin/banners
 * @access  Admin
 */
export const getAllBannersAdmin = asyncHandler(async (req: Request, res: Response) => {
  const banners = await Banner.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: banners,
  });
});

/**
 * @desc    Toggle banner active status
 * @route   PATCH /api/v1/admin/banners/:id/toggle
 * @access  Admin
 */
export const toggleBannerStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.id as string;

  const banner = await Banner.findById(id);

  if (!banner) {
    return res.status(404).json({
      success: false,
      message: 'Banner not found',
    });
  }

  banner.isActive = !banner.isActive;
  await banner.save();

  logger.info('Promotion banner status toggled', { bannerId: id, isActive: banner.isActive });

  res.status(200).json({
    success: true,
    message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
    data: banner,
  });
});

/**
 * @desc    Delete a promotion banner
 * @route   DELETE /api/v1/admin/banners/:id
 * @access  Admin
 */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.id as string;

  const banner = await Banner.findById(id);

  if (!banner) {
    return res.status(404).json({
      success: false,
      message: 'Banner not found',
    });
  }

  // Delete from Cloudinary
  if (banner.publicId) {
    await cloudinary.uploader.destroy(banner.publicId);
  }

  await banner.deleteOne();

  logger.info('Promotion banner deleted successfully', { bannerId: id });

  res.status(200).json({
    success: true,
    message: 'Banner deleted successfully',
  });
});
