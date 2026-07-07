import { z } from "zod";
import { CURRENCY_CONFIG } from "./constants";

const SUPPORTED_ASSETS = Object.keys(CURRENCY_CONFIG) as [string, ...string[]];

const generateCryptoPairSchema = z
  .object({
    coin: z.enum(SUPPORTED_ASSETS, { message: "Asset is required." }),
    chain: z.string({ message: "Chain is required." }),
  })
  .refine(
    (data) => {
      const coinConfig =
        CURRENCY_CONFIG[data.coin as keyof typeof CURRENCY_CONFIG];
      if (!coinConfig) return false;

      // Check if the chain is a valid network key for this specific coin
      return Object.keys(coinConfig.networks).includes(data.chain);
    },
    {
      message: "Invalid chain for the selected asset",
      path: ["chain"],
    },
  );

export const walletValidation = {
  generateCryptoPairSchema,
};
