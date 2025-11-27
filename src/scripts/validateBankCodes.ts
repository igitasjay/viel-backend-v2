import axios from 'axios';
import { Request, Response } from 'express';

async function getBankCodes(req: Request, res: Response): Promise<void> {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });
    console.log('Supported banks:', response.data.data);
    res.json(response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
  }
}

export { getBankCodes };
