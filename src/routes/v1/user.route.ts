import Router from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import authorize from '@/middlewares/authorize.middleware';
import getCurrentUser from '@/controllers/user/get-current-user';
import updateCurrentUser from '@/controllers/user/update-current-user';
import editProfile from '@/controllers/user/edit-profile';
import verifyIdentity from '@/controllers/user/identity-verification.controller';
import registerDeviceToken from '@/controllers/user/register-device';

const router = Router();

router.use(authenticate)

router.get(
  '/current',
  authorize(['user', 'admin']),
  getCurrentUser,
);

router.put(
  '/current',
  authorize(['user', 'admin']),
  updateCurrentUser,
);

router.put(
  '/edit-profile',
  authorize(['user']),
  editProfile,
);

router.post(
  '/verify-identity',
  verifyIdentity,
);

router.post(
  '/device-token',
  authorize(['user', 'admin']),
  registerDeviceToken,
);

export default router;
