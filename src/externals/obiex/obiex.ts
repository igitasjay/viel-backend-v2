import { createHmac } from "crypto";
import { config } from "@shared/config/config";
import { ApiClient } from "../apiclient";
import { logger } from "@/lib/winston";
import { COIN_GECKO_IDS, CoinGeckoResponse, ObiexFiatWithdrawalParams, ObiexFiatWithdrawalResponse } from "./interface";

export class ObiexService {
    private static readonly baseUrl = config.obiex.baseUrl;
    private static readonly apiKey = config.obiex.publicKey;
    private static readonly apiSecret = config.obiex.secretKey;

    private static sign(method: string, path: string, timestamp: number): string {
        // Obiex example: const stringToSign = `${method}/v1${path}${timestamp}`;
        // path here is expected to be e.g. "/addresses/broker"
        const signingPath = path.startsWith("/") ? path : `/${path}`;
        const content = `${method.toUpperCase()}/v1${signingPath}${timestamp}`;

        logger.info(`[Obiex] Signing:`, {
            method: method.toUpperCase(),
            path: signingPath,
            timestamp,
            content,
        });

        const signature = createHmac("sha256", this.apiSecret)
            .update(content)
            .digest("hex");

        return signature;
    }

    /**
     * Make request to Obiex API
     */
    private static async request<T = any>(
        method: "GET" | "POST" | "PUT" | "DELETE",
        path: string,
        data: any = null,
        context: string = "Obiex Request",
    ): Promise<T> {
        const timestamp = Date.now();
        const signature = this.sign(method, path, timestamp);

        const fullUrl = `${this.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

        const headers = {
            "X-API-KEY": this.apiKey,
            "X-API-TIMESTAMP": timestamp,
            "X-API-SIGNATURE": signature,
            "Content-Type": "application/json",
        };

        try {
            const response = await (method === "POST" || method === "PUT"
                ? ApiClient.post<T>(fullUrl, data, { headers }, context)
                : ApiClient.get<T>(fullUrl, null, { headers }, context));
            return response.data;
        } catch (error) {
            logger.error(`[${context}] Failed`, {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }

    /**
     * Get all wallet accounts
     */
    static async getAccounts() {
        return this.request("GET", "/accounts/me", null, "Obiex Get Accounts");
    }

    /**
     * Get supported currencies
     */
    static async getCurrencies() {
        return this.request(
            "GET",
            "/currencies/networks/active",
            null,
            "Obiex Get Currencies",
        );
    }

    /**
     * Create a broker deposit address
     * uniqueUserIdentifier = unique identifier for the user (e.g., userId)
     * (previously called "purpose", both names work but uniqueUserIdentifier is preferred)
     */
    static async createBrokerAddress(body: {
        uniqueUserIdentifier: string;
        currency: string;
        network: string;
    }) {
        return this.request(
            "POST",
            "/addresses/broker",
            body,
            `Obiex Create Broker Address (${body.currency})`,
        );
    }

    /**
     * Get trade quote (for converting tokens to USDT)
     * Used when webhook returns 0.00 amount
     */
    static async getTradeQuote(body: {
        sourceId: string; // Currency ID of the token
        targetId: string; // Currency ID of USDT (static)
        amount: number; // Amount to convert
        side: "SELL" | "BUY"; // Usually "SELL" to get USDT value
    }) {
        return this.request(
            "POST",
            "/trades/quote",
            body,
            `Obiex Get Trade Quote (${body.amount} ${body.sourceId} → ${body.targetId})`,
        );
    }

    static async fetchCryptoPrices() {
        const coinIds = Object.values(COIN_GECKO_IDS).join(",");

        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

        logger.info("Fetching crypto prices from CoinGecko", { url });

        const response = await ApiClient.get<CoinGeckoResponse[]>(url);

        return response.data;
    }

    /**
     * Withdraw fiat (NGN) to a user's bank account via Obiex off-ramping
     * Endpoint: POST /wallets/ext/debit/fiat
     */
    static async withdrawFiat(params: ObiexFiatWithdrawalParams): Promise<ObiexFiatWithdrawalResponse> {
        return this.request<ObiexFiatWithdrawalResponse>(
            "POST",
            "/wallets/ext/debit/fiat",
            {
                amount: params.amount,
                currency: "NGNX",
                narration: params.narration,
                destination: {
                    bankCode: params.bankCode,
                    accountNumber: params.accountNumber,
                    accountName: params.accountName,
                    bankName: params.bankName,
                },
            },
            `Obiex Fiat Withdrawal (₦${params.amount})`,
        );
    }
}
