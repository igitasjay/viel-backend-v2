import type { Request, Response } from 'express';
import { Currency } from '../models/Currency';
import { PriceService } from '../services/price.service';

export const fetchAllCurrencies = async (req: Request, res: Response) => {
  try {
    const rawCurrencies = await Currency.find();
    
    // Fetch live rates for all symbols
    const symbols = Array.from(new Set(rawCurrencies.map((c: any) => c.symbol)));
    const liveRates = await PriceService.getLiveRates(symbols); // Returns Map<Symbol, Price>

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
                naira_rate: curr.naira_rate?.toString(),
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