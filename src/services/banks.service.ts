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

const resolveBankAccount = async (req: Request, res: Response): Promise<void> => {
  const secretKey = config.PAYSTACK_SECRET_KEY;
  const { accountNumber, bankCode } = req.query;

  if (!accountNumber || !bankCode) {
    res.status(400).json({
      success: false,
      message: 'Account number and bank code are required.',
    });
    return;
  }

  try {
    const response = await axios.get('https://api.paystack.co/bank/resolve', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      params: {
        account_number: accountNumber,
        bank_code: bankCode,
      },
    });

    res.json({
      success: true,
      data: response.data.data,
    });
  } catch (error: any) {
    console.error('Resolve bank account failed:', error.message);
    const message = error.response?.data?.message || 'Failed to resolve bank account';
    res.status(error.response?.status || 500).json({
      success: false,
      message,
    });
  }
};

export { getBanks, resolveBankAccount };
export default getBanks;
