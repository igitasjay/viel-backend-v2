import {
    ReloadlyTokenResponse,
    ReloadlyProduct,
    ReloadlyOrderRequest,
    ReloadlyOrderResponse,
} from "./interface";
import { logger } from "@/lib/winston";
import { config } from "@/shared/config/config";
import axios, { AxiosInstance } from "axios"
import { BadRequestException, InternalServerErrorException, NotFoundException } from "@/shared/exceptions/exceptions";
import { prisma } from "@/shared/db/prisma";

const ALLOWED_COUNTRY_CODES = [
    "GB",
    "US",
    "FR",
    "DE",
    "GR",
    "IE",
    "IT",
    "NL",
    "NG",
    "PL",
    "PT",
    "ZA",
    "ES",
    "TR",
];

class ReloadlyService {
    private axiosInstance: AxiosInstance;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private readonly baseUrl: string;
    private readonly authUrl: string;

    constructor() {
        const isSandbox = config.reloadly.environment === "sandbox";
        this.baseUrl = isSandbox
            ? "https://giftcards-sandbox.reloadly.com"
            : "https://giftcards.reloadly.com";

        this.authUrl = "https://auth.reloadly.com";

        this.axiosInstance = axios.create({
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        logger.info(
            `Reloadly service initialized (${config.reloadly.environment} mode)`,
        );
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            logger.info("Fetching new Reloadly access token...");

            const response = await axios.post<ReloadlyTokenResponse>(
                `${this.authUrl}/oauth/token`,
                {
                    client_id: config.reloadly.clientID,
                    client_secret: config.reloadly.clientSecret,
                    grant_type: "client_credentials",
                    audience: this.baseUrl,
                },
            );

            this.accessToken = response.data.access_token;

            logger.info("Reloadly Token for Testing:", this.accessToken as any);

            const expiryTime = new Date();
            expiryTime.setSeconds(
                expiryTime.getSeconds() + response.data.expires_in - 300,
            );
            this.tokenExpiry = expiryTime;

            logger.info("Reloadly access token obtained successfully");
            return this.accessToken;
        } catch (error: any) {
            logger.error(
                "Failed to get Reloadly access token:",
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException(
                "Failed to authenticate with gift card provider",
            );
        }
    }


    async getProducts(countryCode?: string): Promise<ReloadlyProduct[]> {
        try {
            const token = await this.getAccessToken();
            let allProducts: ReloadlyProduct[] = [];
            let currentPage = 1;
            let hasMorePages = true;
            const pageSize = 200;

            while (hasMorePages) {
                const params: any = {
                    size: pageSize,
                    page: currentPage,
                };

                if (countryCode) {
                    params.countryCode = countryCode;
                }

                logger.info(
                    `Fetching products page ${currentPage} (size: ${pageSize})...`,
                );

                const response = await this.axiosInstance.get(
                    `${this.baseUrl}/products`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params,
                    },
                );

                const products = response.data.content || [];
                allProducts = allProducts.concat(products);

                logger.info(
                    `Page ${currentPage}: Fetched ${products.length} products (Total so far: ${allProducts.length})`,
                );

                // Check if there are more pages
                // If we got fewer products than page size, we've reached the end
                if (products.length < pageSize) {
                    hasMorePages = false;
                } else {
                    currentPage++;
                    // Add a small delay to avoid rate limiting
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            logger.info(
                `Fetched total of ${allProducts.length} gift card products from Reloadly across ${currentPage} page(s)`,
            );
            return allProducts;
        } catch (error: any) {
            logger.error(
                "Failed to fetch gift card products:",
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException(
                "Failed to fetch available gift cards",
            );
        }
    }

    async getProductById(productId: string): Promise<any> {
        try {
            const token = await this.getAccessToken();

            logger.info(
                `Fetching product ${productId} from Reloadly for rate refresh`,
            );

            const response = await this.axiosInstance.get(
                `${this.baseUrl}/products/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/com.reloadly.giftcards-v1+json",
                    },
                },
            );

            logger.info(`Successfully fetched fresh data for product ${productId}`);
            return response.data;
        } catch (error: any) {
            logger.error(
                `Failed to fetch product ${productId}:`,
                error.response?.data || error.message,
            );

            // Return null instead of throwing - let caller handle fallback
            return null;
        }
    }


    async getProductsByCountry(countryCode: string): Promise<ReloadlyProduct[]> {
        try {
            const token = await this.getAccessToken();

            const response = await this.axiosInstance.get(
                `${this.baseUrl}/countries/${countryCode}/products`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            logger.info(
                `Fetched ${response.data.length || 0
                } products for country ${countryCode}`,
            );
            return response.data || [];
        } catch (error: any) {
            logger.error(
                `Failed to fetch products for ${countryCode}:`,
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException(
                "Failed to fetch gift cards for this country",
            );
        }
    }

    async placeOrder(
        orderData: ReloadlyOrderRequest,
    ): Promise<ReloadlyOrderResponse> {
        try {
            const token = await this.getAccessToken();

            logger.info(`Placing Reloadly order:`, {
                productId: orderData.productId,
                quantity: orderData.quantity,
                customIdentifier: orderData.customIdentifier,
            });

            const response = await this.axiosInstance.post(
                `${this.baseUrl}/orders`,
                orderData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            logger.info(`Reloadly order placed successfully:`, {
                transactionId: response.data.transactionId,
                customIdentifier: orderData.customIdentifier,
            });

            return response.data;
        } catch (error: any) {
            logger.error(
                "Failed to place Reloadly order:",
                error.response?.data || error.message,
            );

            const errorMessage =
                error.response?.data?.message || "Failed to process gift card purchase";
            throw new BadRequestException(errorMessage);
        }
    }

    async getRedeemCodes(transactionId: number): Promise<any> {
        try {
            const token = await this.getAccessToken();

            logger.info(`Fetching redeem codes for transaction ${transactionId}`);

            const response = await this.axiosInstance.get(
                `${this.baseUrl}/orders/transactions/${transactionId}/cards`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            logger.info(`Retrieved redeem codes for transaction ${transactionId}`);
            return response.data;
        } catch (error: any) {
            logger.error(
                `Failed to get redeem codes for ${transactionId}:`,
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException(
                "Failed to retrieve gift card codes",
            );
        }
    }

    async getOrderStatus(transactionId: number): Promise<any> {
        try {
            const token = await this.getAccessToken();

            const response = await this.axiosInstance.get(
                `${this.baseUrl}/orders/transactions/${transactionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            return response.data;
        } catch (error: any) {
            logger.error(
                `Failed to get order status for ${transactionId}:`,
                error.response?.data || error.message,
            );
            throw new NotFoundException("Order not found");
        }
    }

    async getTransactions(
        page: number = 1,
        size: number = 20,
        startDate?: string,
        endDate?: string,
    ): Promise<any> {
        try {
            const token = await this.getAccessToken();

            const params: any = {
                page,
                size,
            };

            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            logger.info(
                `Fetching Reloadly transactions - page ${page}, size ${size}`,
            );

            const response = await this.axiosInstance.get(
                `${this.baseUrl}/orders/transactions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params,
                },
            );

            logger.info(
                `Retrieved ${response.data?.content?.length || 0} transactions from Reloadly`,
            );
            return response.data;
        } catch (error: any) {
            logger.error(
                "Failed to get transactions:",
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException("Failed to retrieve transactions");
        }
    }


    async getFXRates(): Promise<any> {
        try {
            const token = await this.getAccessToken();

            logger.info("Fetching FX rates from Reloadly");

            const response = await this.axiosInstance.get(
                `${this.baseUrl}/fx-rates`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            logger.info("Successfully retrieved FX rates from Reloadly");
            return response.data;
        } catch (error: any) {
            logger.error(
                "Failed to get FX rates:",
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException("Failed to retrieve FX rates");
        }
    }

    async syncProductsToDatabase(): Promise<{
        synced: number;
        errors: number;
        deactivated: number;
        totalFetched: number;
    }> {
        try {
            logger.info("Starting Reloadly product sync...");

            const products = await this.getProducts();
            let syncedCount = 0;
            let errorCount = 0;
            let skippedCount = 0;

            const reloadlyIds = new Set<string>();

            for (const product of products) {
                try {
                    const productId = String(product.productId);
                    const countryCode = product.country.isoName;

                    if (!ALLOWED_COUNTRY_CODES.includes(countryCode)) {
                        skippedCount++;
                        continue;
                    }

                    reloadlyIds.add(productId);

                    // Handle different denomination types
                    const isFixedType = product.denominationType === "FIXED";
                    const denomination = isFixedType
                        ? product.fixedRecipientDenominations?.[0] || 0
                        : product.minRecipientDenomination || 0;

                    // For FIXED type, minAmount and maxAmount should be null since they use fixedDenominations instead
                    const minAmount = isFixedType
                        ? null
                        : product.minRecipientDenomination || 0;

                    const maxAmount = isFixedType
                        ? null
                        : product.maxRecipientDenomination || 0;

                    // Convert brand name "App Store & iTunes" -> "Apple/iTunes" in reloadlyData
                    const modifiedProduct = { ...product };
                    if (
                        modifiedProduct.brand?.brandName
                            ?.toLowerCase()
                            .includes("app store & itunes")
                    ) {
                        modifiedProduct.brand = {
                            ...modifiedProduct.brand,
                            brandName: modifiedProduct.brand.brandName.replace(
                                /App Store & iTunes/i,
                                "Apple/iTunes",
                            ),
                        };
                    }

                    // Upsert product to database
                    await prisma.giftcardProducts.upsert({
                        where: { reloadlyId: productId },
                        update: {
                            name: product.productName,
                            country: product.country.name,
                            countryCode: product.country.isoName,
                            currency: product.recipientCurrencyCode,
                            denomination: denomination,
                            minAmount: minAmount,
                            maxAmount: maxAmount,
                            imageUrl: product.logoUrls[0] || null,
                            isActive: true,
                            reloadlyData: modifiedProduct as any,
                            updatedAt: new Date(),
                        },
                        create: {
                            reloadlyId: productId,
                            name: product.productName,
                            country: product.country.name,
                            countryCode: product.country.isoName,
                            currency: product.recipientCurrencyCode,
                            denomination: denomination,
                            minAmount: minAmount,
                            maxAmount: maxAmount,
                            imageUrl: product.logoUrls[0] || null,
                            isActive: true,
                            reloadlyData: modifiedProduct as any,
                        },
                    });

                    syncedCount++;
                } catch (error) {
                    logger.error(
                        `Failed to sync product ${product.productId}:`,
                        error as any,
                    );
                    errorCount++;
                }
            }

            // Deactivate products that are no longer in Reloadly's API
            logger.info("Checking for products to deactivate...");
            const deactivateResult = await prisma.giftcardProducts.updateMany({
                where: {
                    reloadlyId: {
                        notIn: Array.from(reloadlyIds),
                    },
                    isActive: true,
                },
                data: {
                    isActive: false,
                    updatedAt: new Date(),
                },
            });

            const deactivatedCount = deactivateResult.count;

            if (deactivatedCount > 0) {
                logger.info(
                    `Deactivated ${deactivatedCount} products no longer available in Reloadly`,
                );
            }

            logger.info(
                `Product sync completed: ${syncedCount} synced, ${skippedCount} skipped (country filter), ${deactivatedCount} deactivated, ${errorCount} errors`,
            );

            return {
                synced: syncedCount,
                errors: errorCount,
                deactivated: deactivatedCount,
                totalFetched: products.length,
            };
        } catch (error) {
            logger.error("Product sync failed:", error as any);
            throw error;
        }
    }
}

export const reloadlyService = new ReloadlyService()