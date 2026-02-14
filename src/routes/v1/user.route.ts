import Router from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import authorize from '@/middlewares/authorize.middleware';
import getCurrentUser from '@/controllers/user/get-current-user';
import updateCurrentUser from '@/controllers/user/update-current-user';
import editProfile from '@/controllers/user/edit-profile';
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

router.put(
  '/edit-profile',
  authenticate,
  authorize(['user']),
  editProfile,
);

export default router;
