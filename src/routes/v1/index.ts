import { Router } from 'express';
import authRouter from '@/routes/v1/auth';
import userRouter from '@/routes/v1/user';
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

export default router;
