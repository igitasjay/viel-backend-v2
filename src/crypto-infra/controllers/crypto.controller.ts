import type { Request, Response } from 'express';
import { Currency } from '../models/Currency';
import { PriceService } from '../services/price.service';

export const fetchAllCurrencies = async (req: Request, res: Response) => {
  try {
    const rawCurrencies = await Currency.find();
    
    // Fetch live rates for all symbols using price_symbol from DB
    const priceRequests = rawCurrencies
        .filter((c: any) => c.price_symbol)
        .map((c: any) => ({
            symbol: c.symbol,
            priceSymbol: c.price_symbol
        }));
    
    // De-dupe based on priceSymbol to avoid redundant API weight
    const uniqueRequests = Array.from(
        new Map(priceRequests.map(item => [item.priceSymbol, item])).values()
    );

    const liveRates = await PriceService.getLiveRates(uniqueRequests); // Returns Map<Symbol, Price>

    // Group by symbol to form the nested structure
    const groupedMap = new Map();

    rawCurrencies.forEach((curr: any) => {
        if (!groupedMap.has(curr.symbol)) {
            // Initialize Group
            groupedMap.set(curr.symbol, {
                id: curr._id, // Using first ID encountered or could be generated
                name: curr.name,
                code: curr.symbol,
                icon: curr.imageUrl, // Assuming icon is same for all networks of a coin
                status: curr.status,
                is_stable: curr.is_stable ? 1 : 0,
                color: curr.color,
                minimumDeposit: curr.minimumDeposit?.toFixed(10), // Formatting to string as per JSON
                maximumDecimalPlaces: curr.maximumDecimalPlaces,
                naira_rate: curr.buyRate?.toString(),
                buyRate: curr.buyRate,
                sellRate: curr.sellRate,
                usd_rate: (liveRates.get(curr.symbol) ?? curr.usd_rate)?.toFixed(10),
                created_at: curr.createdAt,
                updated_at: curr.updatedAt,
                networks: []
            });
        }
        
        // Add Network
        const group = groupedMap.get(curr.symbol);
        group.networks.push({
            id: curr._id, // Using the doc ID as network ID
            addressRegex: curr.addressRegex,
            memoRegex: curr.memoRegex,
            name: `${curr.name} (${curr.network})`, // e.g. Ethereum (ERC20) - approximating naming convention
            code: curr.network,
            fee: curr.fee?.toFixed(10),
            feeType: curr.feeType,
            minimum: curr.minimum?.toFixed(10),
            buyRate: curr.buyRate,
            sellRate: curr.sellRate,
            contractAddress: curr.contractAddress,
            explorerLink: curr.explorerLink,
            created_at: curr.createdAt,
            updated_at: curr.updatedAt
        });
    });

    const currencies = Array.from(groupedMap.values());
    
    return res.json({ all: currencies });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};