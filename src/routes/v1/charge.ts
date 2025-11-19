import { Router, Request, Response } from 'express';
import { chargeBankAccount, submitOtp } from '@/services/paystack';
import { ChargeBankRequest, SubmitOtpRequest } from '@/types/paystack';

const router = Router();

router.post('/charge', async (req: Request, res: Response) => {
  const { email, amount, bank, birthday, metadata } = req.body;

  // Validate request
  if (
    !email ||
    !amount ||
    !bank?.account_number ||
    !bank?.code ||
    typeof bank.code !== 'string' ||
    !birthday
  ) {
    return res.status(400).json({
      error: 'Missing or invalid required fields',
      details:
        'Ensure email, amount, bank.account_number, bank.code (string), and birthday are provided',
    });
  }

  try {
    const payload: ChargeBankRequest = {
      email,
      amount: amount * 100, // Convert to kobo
      bank: {
        account_number: bank.account_number,
        code: bank.code,
      },
      birthday,
      metadata: metadata || {
        custom_fields: [
          {
            value: 'makurdi',
            display_name: 'Donation for',
            variable_name: 'donation_for',
          },
        ],
      },
    };

    const result = await chargeBankAccount(payload);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Charge error:', error.message, error.stack);
    res.status(500).json({
      error: 'Charge failed',
      errorDetails: {
        message: error.message || 'Unknown error',
        stack: error.stack || 'No stack trace available',
        paystackResponse: error.paystackResponse || null,
        status: error.status || null,
      },
    });
  }
});

router.post('/submit-otp', async (req: Request, res: Response) => {
  const { otp, reference } = req.body;

  // Validate request
  if (
    !otp ||
    !reference ||
    typeof otp !== 'string' ||
    typeof reference !== 'string'
  ) {
    return res.status(400).json({
      error: 'Missing or invalid required fields',
      details: 'Ensure otp and reference are provided as strings',
    });
  }

  try {
    const payload: SubmitOtpRequest = {
      otp,
      reference,
    };

    const result = await submitOtp(payload);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('OTP submission error:', error.message, error.stack);
    res.status(500).json({
      error: 'OTP submission failed',
      errorDetails: {
        message: error.message || 'Unknown error',
        stack: error.stack || 'No stack trace available',
        paystackResponse: error.paystackResponse || null,
        status: error.status || null,
      },
    });
  }
});

export default router;
