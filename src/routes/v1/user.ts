import Router from 'express';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import getCurrentUser from '@/controllers/user/get-current-user';
import updateCurrentUser from '@/controllers/user/update-current-user';
const router = Router();

router.get(
  '/current',
  authenticate,
  authorize(['user', 'admin']),
  getCurrentUser,
);

router.put(
  '/current',
  authenticate,
  authorize(['user', 'admin']),
  updateCurrentUser,
);

export default router;
