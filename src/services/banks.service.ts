import config from '@/config/config';
import { Request, Response } from 'express';
import axios from 'axios';

const getBanks = async (req: Request, res: Response): Promise<void> => {
  const secretKey = config.PAYSTACK_SECRET_KEY;
  const { search } = req.query;

  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      params: {
        currency: 'NGN',
      },
    });

    let banks = response.data.data;

    if (search) {
      const query = (search as string).toLowerCase();
      banks = banks.filter((bank: any) =>
        bank.name.toLowerCase().includes(query) ||
        bank.code.toLowerCase().includes(query)
      );
    }

    res.json({
      success: true,
      data: banks,
    });
  } catch (error: any) {
    console.error('Fetch banks failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
};

export default getBanks;
