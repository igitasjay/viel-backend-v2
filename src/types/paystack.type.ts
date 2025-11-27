export interface ChargeBankRequest {
  email: string;
  amount: number; // in kobo
  bank: {
    code: string;
    account_number: string;
  };
  birthday: string; // YYYY-MM-DD
  metadata?: {
    custom_fields: Array<{
      value: string;
      display_name: string;
      variable_name: string;
    }>;
  };
}

export interface SubmitOtpRequest {
  otp: string;
  reference: string;
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    status: string;
  };
}
