export interface MonnifyAuthResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    accessToken: string;
    expiresIn: number;
  };
}

export interface MonnifyTransactionResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    transactionReference: string;
    paymentReference: string;
    amountPaid: string;
    totalPayable: string;
    settlementAmount: string;
    paidOn: string;
    paymentStatus: string;
    paymentDescription: string;
    currency: string;
    paymentMethod: string;
    product: {
      reference: string;
      type: string;
    };
    customer: {
      email: string;
      name: string;
    };
    metaData: any;
  };
}

export interface MonnifyBankTransferRequest {
  transactionReference: string;
  bankCode: string;
}

export interface MonnifyBankTransferResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    amount: number;
    transactionReference: string;
    paymentReference: string;
    accountDuration: number;
    status: string;
  };
}
