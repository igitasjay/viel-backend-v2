import { Router } from 'express';
import * as bannerCtrl from './banner.controller';

export const bannerRoutes = Router();

bannerRoutes.get('/', bannerCtrl.getBanners);
