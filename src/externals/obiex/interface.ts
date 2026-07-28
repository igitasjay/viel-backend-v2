export interface GenerateWalletBody {
    subwalletID: string;
    coin: string;
    chain: string;
}

export interface CreateSubAccount {
    name: string;
    email: string;
}

// CoinGecko coin IDs mapping
export const COIN_GECKO_IDS = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    BCH: "bitcoin-cash",
    BNB: "binancecoin",
    LTC: "litcoin",
    POL: "polygon",
    XRP: "xrp",
    USDC: "usd-coin",
    TRX: "tron",
    SOL: "solana",
    POLYGON: "polygon",
    SHIB: "shiba-inu",
    DOGE: "dogecoin",
};

export interface CoinGeckoResponse {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    total_volume: number;
    image: string;
}

export const COINS = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    // USDT: "Tether",
    // BNB: "Binance Coin",
    // USDC: "USD Coin",
    // TRX: "Tron",
    // SOL: "Solana",
    // MATIC: "Polygon",
    // SHIB: "Shiba Inu",
    // DOGE: "Dogecoin",
};

export interface ObiexFiatWithdrawalParams {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
}

export interface ObiexFiatWithdrawalResponse {
    message: string;
    data: {
        id: string;
        reference: string;
        type: string;
        category: string;
        amount: number;
        payout: {
            id: string;
            status: string;
            fee: number;
            payoutAmount: number;
            payoutCurrency: string;
            bankAccount: {
                accountNumber: string;
                accountName: string;
                bankName: string;
            };
            transactionId: string;
        };
    };
}
