import { Router } from 'express';
import * as adminUserCtrl from '@/controllers/admin-user.controller';
import authenticate from '@/middlewares/authenticate.middleware';
import authorize from '@/middlewares/authorize.middleware';

const router = Router();

// All admin user routes require admin role
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', adminUserCtrl.getAllUsers);
router.patch('/password', adminUserCtrl.updateUserPassword);
router.patch('/suspend', adminUserCtrl.suspendUserAccount);
router.patch('/activate', adminUserCtrl.activateUserAccount);
router.delete('/', adminUserCtrl.deleteUserAccount);
router.get('/transactions', adminUserCtrl.getUserTransactionHistory);

export default router;
