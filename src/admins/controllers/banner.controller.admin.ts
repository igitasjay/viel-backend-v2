import { Request, Response } from 'express';
import { prisma } from '@/shared/db/prisma';
import { asyncHandler } from '@/utils/async-handler.util';
import { logger } from '@/lib/winston';
import cloudinary from '@/config/cloudinary.config';

export const uploadBanner = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Banner image is required',
    });
  }

  const { title, link } = req.body;

  const banner = await prisma.banner.create({
    data: {
      imageUrl: req.file.path,
      publicId: (req.file as any).filename || (req.file as any).public_id,
      title: title || null,
      link: link || null,
    },
  });

  logger.info('Promotion banner uploaded successfully', { bannerId: banner.id });

  res.status(201).json({
    success: true,
    message: 'Banner uploaded successfully',
    data: banner,
  });
});

export const getAllBannersAdmin = asyncHandler(async (req: Request, res: Response) => {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: banners,
  });
});

export const toggleBannerStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    return res.status(404).json({
      success: false,
      message: 'Banner not found',
    });
  }

  const updatedBanner = await prisma.banner.update({
    where: { id },
    data: {
      isActive: !banner.isActive,
    },
  });

  logger.info('Promotion banner status toggled', { bannerId: id, isActive: updatedBanner.isActive });

  res.status(200).json({
    success: true,
    message: `Banner ${updatedBanner.isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedBanner,
  });
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

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

  await prisma.banner.delete({
    where: { id },
  });

  logger.info('Promotion banner deleted successfully', { bannerId: id });

  res.status(200).json({
    success: true,
    message: 'Banner deleted successfully',
  });
});
