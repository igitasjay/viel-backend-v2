export class WalletResponseDTO {
  id: string;
  asset: string;
  chain: string;
  address: string;
  qrCode: string;

  constructor(wallet: any) {
    this.id = wallet.id;
    this.asset = wallet.asset;
    this.chain = wallet.chain;
    this.address = wallet.address;
    this.qrCode = wallet.qrCode;
  }
}

export class GetWalletsDTO {
  id: string;
  userId: string;
  asset: string;
  chain: string;
  address: string;
  qrCode?: string | null;
  rate: number;

  constructor(wallet: any, rate: number = 0) {
    this.id = wallet.id;
    this.userId = wallet.userId;
    this.asset = wallet.asset;
    this.chain = wallet.chain;
    this.address = wallet.address;
    this.qrCode = wallet.qrCode ?? null;
    this.rate = rate;
  }

  static fromArray(
    wallets: any[],
    ratesMap: Record<string, number> = {},
  ): GetWalletsDTO[] {
    return wallets.map(
      (wallet) => new GetWalletsDTO(wallet, ratesMap[wallet.asset] || 0),
    );
  }
}

export class ObiexNetworkDTO {
  networkName: string;
  networkCode: string;
  minimumDeposit: number;

  constructor(network: any) {
    this.networkName = network.networkName;
    this.networkCode = network.networkCode;
    this.minimumDeposit = Number(network.minimumDeposit);
  }
}

export class ObiexCurrencyDTO {
  symbol: string;
  currencyName: string;
  networks: ObiexNetworkDTO[];
  image?: string;

  constructor(symbol: string, data: any, image?: string) {
    this.symbol = symbol;
    this.currencyName = data.currencyName;
    this.image = image;

    const rawNetworks = (data.networks || []).map(
      (n: any) => new ObiexNetworkDTO(n),
    );
    const NETWORK_PRIORITY: Record<string, Record<string, number>> = {
      BTC: {
        BTC: 1,
        BSC: 2,
      },
      USDT: {
        TRX: 1,
        ETH: 2,
        BSC: 3,
      },
    };

    const priorities = NETWORK_PRIORITY[symbol];
    if (priorities) {
      this.networks = rawNetworks.sort((a: any, b: any) => {
        const priorityA = priorities[a.networkCode] || 999;
        const priorityB = priorities[b.networkCode] || 999;
        return priorityA - priorityB;
      });
    } else {
      this.networks = rawNetworks;
    }
  }

  static fromMap(
    dataMap: Record<string, any>,
    images: Record<string, string> = {},
  ): ObiexCurrencyDTO[] {
    return Object.entries(dataMap).map(
      ([symbol, data]) => new ObiexCurrencyDTO(symbol, data, images[symbol]),
    );
  }
}

/**
 * Slim DTO for market insights - only essential fields
 */
export class MarketInsightDTO {
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;

  constructor(data: any) {
    this.symbol = data.symbol.toUpperCase();
    this.name = data.name;
    this.image = data.image;
    this.currentPrice = data.current_price;
    this.priceChange24h = data.price_change_percentage_24h;
    this.marketCap = data.market_cap;
  }

  static fromArray(data: any[]): MarketInsightDTO[] {
    return data.map((item) => new MarketInsightDTO(item));
  }
}
