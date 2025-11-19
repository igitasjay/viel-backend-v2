import config from '@/config';
import { Request, Response } from 'express';
// import { getPaystackBanks } from './paystack';

const getBanks = async (req: Request, res: Response): Promise<void> => {
  const secretKey = config.PAYSTACK_SECRET_KEY;
  try {
    // const banks = await getPaystackBanks(secretKey, 'nigeria');
    // res.json(banks);
  } catch (error: any) {
    const safeError = { message: error.message };
    console.error('Fetch banks failed:', safeError);
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
};

export default getBanks;
