import { Router } from 'express';
import { requireAuth } from '@/shared/middlewares';
import { isAdmin } from '@/middlewares/role-check.middleware';
import { uploadBanner as uploadMiddleware } from '@/middlewares/banner-upload';
import * as bannerCtrl from '../controllers/banner.controller.admin';

export const bannerRoutesAdmin = Router();

// Apply auth and admin middleware to all routes
bannerRoutesAdmin.use(requireAuth, isAdmin);

bannerRoutesAdmin.post('/upload', uploadMiddleware.single('image'), bannerCtrl.uploadBanner);
bannerRoutesAdmin.get('/', bannerCtrl.getAllBannersAdmin);
bannerRoutesAdmin.patch('/:id/toggle', bannerCtrl.toggleBannerStatus);
bannerRoutesAdmin.delete('/:id', bannerCtrl.deleteBanner);
