import { Router } from 'express';
import * as bannerCtrl from '@/controllers/banner.controller';

const router = Router();

router.get('/', bannerCtrl.getBanners);

export default router;
