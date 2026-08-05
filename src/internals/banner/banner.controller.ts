import { Request, Response } from 'express';
import { prisma } from '@/shared/db/prisma';
import { asyncHandler } from '@/utils/async-handler.util';

/**
 * @desc    Get all active promotion banners
 * @route   GET /api/v2/banners
 * @access  Public/User
 */
export const getBanners = asyncHandler(async (req: Request, res: Response) => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: banners,
  });
});
