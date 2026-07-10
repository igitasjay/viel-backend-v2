import { Router } from 'express';
import * as bannerCtrl from '@/controllers/banner.controller';

const bannerrouter = Router();

bannerrouter.get('/', bannerCtrl.getBanners);

export default bannerrouter;
