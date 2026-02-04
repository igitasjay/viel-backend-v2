import { Router } from 'express';
import * as bannerCtrl from '@/controllers/banner.controller';
import { uploadBanner } from '@/middlewares/banner-upload';
import authenticate from '@/middlewares/authenticate.middleware';
import authorize from '@/middlewares/authorize.middleware';

const router = Router();

// Apply admin protection
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', bannerCtrl.getAllBannersAdmin);
router.post('/upload', uploadBanner.single('image'), bannerCtrl.uploadBanner);
router.patch('/toggle', bannerCtrl.toggleBannerStatus);
router.delete('/', bannerCtrl.deleteBanner);

export default router;
