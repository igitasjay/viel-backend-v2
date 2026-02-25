import type { Request, Response } from 'express';
import { Currency } from '../models/currency.model';
import { PriceService } from '../services/price.service';

export const fetchAllCurrencies = async (req: Request, res: Response) => {
  try {
    const rawCurrencies = await Currency.find();
    
    // Auto-derive TwelveData symbols as SYMBOL/USD for each unique coin
    const uniqueSymbols = Array.from(new Set(rawCurrencies.map((c: any) => c.symbol)));
    const priceRequests = uniqueSymbols.map(symbol => ({
        symbol,
        priceSymbol: `${symbol}/USD`,
    }));

    const liveRates = await PriceService.getLiveRates(priceRequests); // Returns Map<Symbol, USD price>

    const groupedMap = new Map();

    rawCurrencies.forEach((curr: any) => {
        if (!groupedMap.has(curr.symbol)) {
            const liveUsdRate = liveRates.get(curr.symbol);
            groupedMap.set(curr.symbol, {
                id: curr._id,
                name: curr.name,
                code: curr.symbol,
                icon: curr.imageUrl,
                status: curr.status,
                is_stable: curr.is_stable ? 1 : 0,
                color: curr.color,
                minimumDeposit: curr.minimumDeposit?.toFixed(10),
                maximumDecimalPlaces: curr.maximumDecimalPlaces,
                naira_rate: curr.buyRate?.toString(),
                buyRate: curr.buyRate,
                sellRate: curr.sellRate,
                usd_rate: liveUsdRate != null ? liveUsdRate.toFixed(10) : (curr.usd_rate ?? 0).toFixed(10),
                created_at: curr.createdAt,
                updated_at: curr.updatedAt,
                networks: []
            });
        }
        
        // Add Network
        const group = groupedMap.get(curr.symbol);
        group.networks.push({
            id: curr._id,
            addressRegex: curr.addressRegex,
            memoRegex: curr.memoRegex,
            name: `${curr.name}`,
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