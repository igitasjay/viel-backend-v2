import { Request, Response } from "express";
import { config } from "@shared/config/config";
import crypto from "crypto";
import { walletValidation } from "./crypto.validation";
import {
  WalletResponseDTO,
  GetWalletsDTO,
  ObiexCurrencyDTO,
  MarketInsightDTO,
} from "./crypto.dtos";
import { prisma } from "@shared/db/prisma";
import { generateCryptoQRCode } from "@shared/helpers/qr-code";
import * as switchX from "../../externals";
import { Asyncly } from "@shared/extensions/asyncly";
import { logger } from "@/lib/winston";
import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@shared/exceptions/exceptions";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { CURRENCY_CONFIG } from "./constants";
import { ObiexEvent } from "./interface";
import { handleSwitchWebhook } from "./crypto.service";

const generateCryptoWallet = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser.id;
  const { coin, chain } = walletValidation.generateCryptoPairSchema.parse(
    req.body,
  );

  if (!userId) {
    throw new UnauthorizedException("Authentication required");
  }

  // Enforce bank account requirement
  const externalAccount = await prisma.externalAccount.findFirst({
    where: { userId },
  });

  if (!externalAccount) {
    throw new BadRequestException(
      "You must add a bank account before generating a crypto wallet.",
    );
  }

  // Check if wallet already exists for this asset and chain
  const existingWallet = await prisma.cryptoWallet.findUnique({
    where: {
      userId_asset_chain: { userId, asset: coin, chain: chain },
    },
  });

  if (existingWallet) {
    logger.info(
      `Existing wallet found for user ${userId}: ${coin} on ${chain}`,
    );
    return res.status(httpStatus.OK).json({
      message: "Wallet already exists",
      wallet: new WalletResponseDTO(existingWallet),
    });
  }

  const userWallet = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullname: true,
      obiExAccountId: true,
    },
  });

  if (!userWallet) {
    throw new NotFoundException("User not found");
  }

  // Map requested chain to Obiex network code using currency-specific mapping
  const coinConfig = CURRENCY_CONFIG[coin as keyof typeof CURRENCY_CONFIG];
  const obiexNetwork =
    coinConfig?.networks[chain as keyof typeof coinConfig.networks] || chain;

  const addressResponse = await switchX.ObiexService.createBrokerAddress({
    uniqueUserIdentifier: userWallet.obiExAccountId!,
    currency: coin,
    network: obiexNetwork,
  });

  if (!addressResponse || !addressResponse.data) {
    throw new InternalServerErrorException(
      "Failed to generate deposit address",
    );
  }

  const generatedAddress = addressResponse.data.value;
  const qrCode = await generateCryptoQRCode(generatedAddress);

  // Create the actual wallet
  const wallet = await prisma.cryptoWallet.create({
    data: {
      userId,
      address: generatedAddress,
      asset: coin,
      chain: chain,
      qrCode,
    },
  });

  logger.info(
    `Crypto wallet generated: ${coin} on ${chain} for user ${userId}`,
  );

  return res.status(httpStatus.CREATED).json({
    message: "Wallet generated successfully",
    wallet: new WalletResponseDTO(wallet),
  });
});

const getAllUserWallet = Asyncly(async (req, res) => {
  const userId = req.currentUser.id;

  const wallets = await prisma.cryptoWallet.findMany({
    where: {
      userId: userId,
    },
  });

  if (wallets.length === 0) {
    throw new BadRequestException("No wallet found, generate one first");
  }

  const assets = [
    ...new Set(
      wallets
        .map((w) => w.asset)
        .filter((asset): asset is string => asset !== null),
    ),
  ];

  // Fetch rates for these assets
  const activeAssets = await prisma.cryptoAsset.findMany({
    where: {
      code: {
        in: assets,
      },
      buyRate: {
        not: null,
      },
    },
    select: {
      code: true,
      buyRate: true,
    },
  });

  const ratesMap = activeAssets.reduce(
    (acc, curr) => {
      acc[curr.code] = Number(curr.buyRate);
      return acc;
    },
    {} as Record<string, number>,
  );

  return res.status(httpStatus.CREATED).json({
    message: "wallets retrieved successfully",
    wallets: GetWalletsDTO.fromArray(wallets, ratesMap),
  });
});

const getCoinRate = Asyncly(async (_req, res) => {
  logger.info("getCoinRate: Fetching all crypto rates");

  const assetsWithRates = await prisma.cryptoAsset.findMany({
    where: {
      isActive: true,
      buyRate: {
        not: null,
      },
    },
    select: {
      code: true,
      buyRate: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  logger.info("getCoinRate: Retrieved rates successfully", {
    count: assetsWithRates.length,
  });

  res.status(httpStatus.OK).json({
    message: "Crypto rates retrieved successfully",
    rates: assetsWithRates.map((asset) => ({
      baseAsset: asset.code,
      rate: asset.buyRate,
    })),
  });
});

const webhookHandler = Asyncly(async (req: Request, res: Response) => {
  const signatureSecret = config.obiex.webhookSecret;

  logger.info("=== OBIEX WEBHOOK RECEIVED ===");
  console.log("=== OBIEX WEBHOOK RECEIVED ===")

  const receivedSignature = req.headers["x-obiex-signature"] as string;

  // Use the rawBody from middleware
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // console.log("Raw Body:", rawBody);

  const computedSignature = crypto
    .createHmac("sha512", signatureSecret)
    .update(rawBody)
    .digest("hex");

  if (computedSignature !== receivedSignature) {
    logger.error("❌ Signature verification failed");
    return res.status(401).send("Invalid signing");
  }

  logger.info("✅ Signature verified successfully");

  try {
    const event: ObiexEvent = req.body;
    const { type, status } = event;

    logger.info(`Event Type: ${type}, Status: ${status}`);

    // Validate deposit event
    if (type !== "DEPOSIT" || !["CONFIRMED", "PENDING"].includes(status)) {
      logger.info(`Ignored non-deposit event: ${type} - ${status}`);
      return res
        .status(200)
        .json({ ok: true, message: "Ignored non-deposit event" });
    }

    // Ensure basic fields are present
    if (!event.address || !event.network) {
      logger.warn("⚠️ Invalid webhook payload - missing address or network");
      return res.status(400).json({ error: "Invalid payload" });
    }

    logger.info("Processing deposit event...", {
      address: event.address,
      network: event.network,
      amount: event.amount,
      currency: event.currency,
    });

    await handleSwitchWebhook(event);

    logger.info("✅ Obiex Event successfully processed");
    return res.status(200).json({ ok: true, message: "Event processed" });
  } catch (err) {
    logger.error(`❌ Webhook processing failed: ${err}`);
    return res.status(500).json({ error: "Failed to process webhook" });
  }
});

const getCryptos = Asyncly(async (_req, res) => {
  logger.info("Fetching supported cryptos from Obiex");
  const response = await switchX.ObiexService.getCurrencies();

  const activeAssets = await prisma.cryptoAsset.findMany({
    where: { isActive: true },
  });

  const activeCodes = new Set(activeAssets.map((a) => a.code));
  const imageMap = activeAssets.reduce(
    (acc, asset) => {
      if (asset.imageUrl) acc[asset.code] = asset.imageUrl;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Filter Obiex data to only include active assets
  const obiexData = response.data || {};
  const filteredData = Object.keys(obiexData)
    .filter((symbol) => activeCodes.has(symbol))
    .reduce(
      (acc, symbol) => {
        acc[symbol] = obiexData[symbol];
        return acc;
      },
      {} as Record<string, any>,
    );

  const cryptos = ObiexCurrencyDTO.fromMap(filteredData, imageMap);

  res.status(httpStatus.OK).json({
    message: "Cryptocurrencies retrieved successfully",
    cryptos: cryptos,
  });
});

const getMarketInsights = Asyncly(async (_req, res) => {
  const prices = await switchX.ObiexService.fetchCryptoPrices();

  const insights = MarketInsightDTO.fromArray(prices);

  res.status(httpStatus.OK).json({
    message: "Market insights retrieved successfully",
    data: insights,
  });
});

export const cryptoWalletController = {
  generateCryptoWallet,
  getAllUserWallet,
  getCoinRate,
  getCryptos,
  getMarketInsights,
  webhookHandler,
  // getUserWallet
  // generateVirtualWallets
};
