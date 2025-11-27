interface InitializePayload {
  email: string;
  amount: number; // Naira
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export const initializeTransaction = async (payload: InitializePayload) => {
  const response = await fetch(
    'https://api.paystack.co/transaction/initialize',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        amount: Math.round(payload.amount * 100), // Convert to kobo
        currency: 'NGN',
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Paystack init failed: ${response.statusText}`);
  return response.json();
};

export const verifyTransaction = async (reference: string) => {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );
  if (!response.ok)
    throw new Error(`Paystack verify failed: ${response.statusText}`);
  return response.json();
};
