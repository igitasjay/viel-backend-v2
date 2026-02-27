import { Request, Response } from 'express';
import { getMonnifyBanks, resolveMonnifyBankAccount } from '@/monnify-infra/services/monnify.service';

const getBanks = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;

  try {
    const response = await getMonnifyBanks();

    if (response.requestSuccessful) {
      let banks = response.responseBody || [];

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
    } else {
      res.status(400).json({
        success: false,
        message: response.responseMessage || 'Failed to fetch banks',
      });
    }
  } catch (error: any) {
    console.error('Fetch banks failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banks',
    });
  }
};

const resolveBankAccount = async (req: Request, res: Response): Promise<void> => {
  const { accountNumber, bankCode } = req.query;

  if (!accountNumber || !bankCode) {
    res.status(400).json({
      success: false,
      message: 'Account number and bank code are required.',
    });
    return;
  }

  try {
    const response = await resolveMonnifyBankAccount(
      accountNumber as string,
      bankCode as string,
    );

    if (response.requestSuccessful) {
      // Map Monnify response to Paystack-style structure to preserve API consistency
      res.json({
        success: true,
        data: {
          account_number: response.responseBody.accountNumber,
          account_name: response.responseBody.accountName,
          bank_code: response.responseBody.bankCode,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.responseMessage || 'Failed to resolve bank account',
      });
    }
  } catch (error: any) {
    console.error('Resolve bank account failed:', error.message);
    const message = error.response?.data?.responseMessage || 'Failed to resolve bank account';
    res.status(error.response?.status || 500).json({
      success: false,
      message,
    });
  }
};

export { getBanks, resolveBankAccount };
export default getBanks;
