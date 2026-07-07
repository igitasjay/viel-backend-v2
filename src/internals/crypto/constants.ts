export const CURRENCY_CONFIG = {
  BCH: {
    name: "Bitcoin Cash",
    networks: { BCH: "BCH" },
  },
  BNB: {
    name: "Binance Coin",
    networks: { ETH: "ETH", BSC: "BSC" },
  },
  BTC: {
    name: "Bitcoin",
    networks: { BSC: "BSC", BTC: "BTC" },
  },
  DOGE: {
    name: "Dogecoin",
    networks: { DOGE: "DOGE", BSC: "BSC" },
  },
  ETH: {
    name: "Ethereum",
    networks: { ETH: "ETH", BASE: "BASE", ARBITRUM: "ARBITRUM", BSC: "BSC" },
  },
  LTC: {
    name: "Litecoin",
    networks: { LTC: "LTC" },
  },
  POL: {
    name: "Polygon",
    networks: { MATIC: "MATIC", ETH: "ETH", BSC: "BSC" },
  },
  SHIB: {
    name: "Shiba Inu",
    networks: { BSC: "BSC", ETH: "ETH" },
  },
  SOL: {
    name: "Solana",
    networks: { BSC: "BSC", SOL: "SOL" },
  },
  TRX: {
    name: "Tron",
    networks: { TRX: "TRX" },
  },
  USDC: {
    name: "USD Coin",
    networks: {
      ETH: "ETH",
      BSC: "BSC",
      SOL: "SOL",
      BASE: "BASE",
      MATIC: "MATIC",
      AVAXC: "AVAXC",
      ARBITRUM: "ARBITRUM",
    },
  },
  USDT: {
    name: "Tether",
    networks: {
      MATIC: "MATIC",
      TRX: "TRX",
      SOL: "SOL",
      ARBITRUM: "ARBITRUM",
      BSC: "BSC",
      AVAXC: "AVAXC",
      ETH: "ETH",
    },
  },
} as const;

export type SupportedCoin = keyof typeof CURRENCY_CONFIG;

export const SUPPORTED_DEPOSIT_OPTIONS = Object.keys(CURRENCY_CONFIG).map(
  (coin) => ({ coin: coin as SupportedCoin }),
);
