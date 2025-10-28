import { Router } from 'express';
import authRouter from '@/routes/v1/auth';
import userRouter from '@/routes/v1/user';
import payRouter from '@/routes/v1/pay';
import bankRouter from '@/routes/v1/banks.route';
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'API is live!!',
    status: 'ok',
    version: '1.0.0',
    docs: '/docs',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/pay', payRouter);
router.use('/banks', bankRouter);

export default router;
