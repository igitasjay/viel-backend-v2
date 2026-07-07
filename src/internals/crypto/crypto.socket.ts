// import { getSocketIO } from "@shared/lib";
// import { logger } from "@shared/common";
// import { prisma } from "@shared/db";

// let rateBroadcastInterval: NodeJS.Timeout | null = null;
// const BROADCAST_INTERVAL_MS = 5 * 60 * 1000;

// /**
//  * Fetches active crypto rates and broadcasts them to all connected clients
//  */
// const broadcastRates = async () => {
//   try {
//     const io = getSocketIO();
//     if (!io) {
//       logger.warn("Socket.IO not initialized, skipping crypto rate broadcast");
//       return;
//     }

//     const assetsWithRates = await prisma.cryptoAsset.findMany({
//       where: {
//         isActive: true,
//         buyRate: {
//           not: null,
//         },
//       },
//       select: {
//         code: true,
//         buyRate: true,
//       },
//       orderBy: {
//         code: "asc",
//       },
//     });

//     const rates = assetsWithRates.map((asset) => ({
//       baseAsset: asset.code,
//       rate: asset.buyRate,
//     }));

//     io.emit("crypto:rates", {
//       message: "Live crypto rates update",
//       rates,
//     });

//     logger.info(`📡 Broadcasted crypto rates for ${rates.length} assets`);
//   } catch (error) {
//     logger.error("❌ Failed to broadcast crypto rates:", { error });
//   }
// };

// /**
//  * Starts the periodic broadcasting of crypto rates
//  */
// export const startCryptoRateBroadcasting = (
//   intervalMs: number = BROADCAST_INTERVAL_MS,
// ) => {
//   if (rateBroadcastInterval) {
//     logger.warn("Crypto rate broadcasting is already running");
//     return;
//   }

//   // Initial broadcast
//   broadcastRates();

//   rateBroadcastInterval = setInterval(broadcastRates, intervalMs);
//   logger.info(
//     `✅ Crypto rate broadcasting started (Interval: ${intervalMs}ms)`,
//   );
// };

// /**
//  * Stops the periodic broadcasting of crypto rates
//  */
// export const stopCryptoRateBroadcasting = () => {
//   if (rateBroadcastInterval) {
//     clearInterval(rateBroadcastInterval);
//     rateBroadcastInterval = null;
//     logger.info("🛑 Crypto rate broadcasting stopped");
//   }
// };
