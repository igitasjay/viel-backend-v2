import { Router } from 'express';
import { getSettings, updateSettings } from '@/controllers/admin-setting.controller';
import authenticate from '@/middlewares/authenticate.middleware';
import authorize from '@/middlewares/authorize.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', getSettings);
router.patch('/', updateSettings);

export default router;
