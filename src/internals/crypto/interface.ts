export interface ObiexEvent {
  type: string;
  currency: string;
  amount: number;
  status: string;
  reference: string;
  transactionId: string;
  createdAt: string;
  lastUpdated: string;
  hash: string;
  network: string;
  address: string;
}
