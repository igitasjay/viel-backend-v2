import cron from "node-cron";
import { prisma } from "@/shared/db/prisma";
import { logger } from "@/lib/winston";
import { reloadlyService } from "../externals/reloadly/reloadly";
import { encrypt } from "@/shared/utils/encryption";
// import { getGiftcardMeta } from "../internals/giftcard+/giftcard.types";

export function startGiftcardCodePolling() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Starting giftcard code polling job...");

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const processingTransactions = await prisma.transaction.findMany({
        where: {
          category: "GIFTCARDS",
          status: "PROCESSING",
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        include: {
          giftcardCodes: true,
        },
      });

      if (processingTransactions.length === 0) {
        logger.info(
          "No processing gift card transactions found to poll for codes",
        );
        return;
      }

      logger.info(
        `Found ${processingTransactions.length} processing gift card transactions to check for codes`,
      );

      let codesRetrieved = 0;
      let ordersCompleted = 0;

      for (const txn of processingTransactions) {
        // const gcMeta = getGiftcardMeta(txn);

        if (txn.giftcardCodes && txn.giftcardCodes.length > 0) {
          logger.warn(
            `Transaction ${txn.id} has status PROCESSING but already has ${txn.giftcardCodes.length} codes. Updating status to SUCCESS.`,
          );
          await prisma.transaction.update({
            where: { id: txn.id },
            data: { status: "SUCCESS" },
          });

          ordersCompleted++;
          continue;
        }

        const externalRef = txn.externalRef;

        if (!externalRef) {
          logger.warn(
            `Transaction ${txn.id} has no externalRef in metadata, skipping...`,
          );
          continue;
        }

        try {
          logger.info(
            `Attempting to fetch codes for transaction ${txn.id} (External Ref: ${externalRef})`,
          );

          const codesResponse = await reloadlyService.getRedeemCodes(
            parseInt(externalRef),
          );

          if (!codesResponse || !Array.isArray(codesResponse)) {
            logger.info(
              `No codes available yet for transaction ${txn.id}, will retry in next poll`,
            );
            continue;
          }

          if (codesResponse.length === 0) {
            logger.info(
              `Empty codes array for transaction ${txn.id}, will retry in next poll`,
            );
            continue;
          }

          logger.info(
            `Retrieved ${codesResponse.length} code(s) for transaction ${txn.id}`,
          );

          const giftcardPurchaseCodes = codesResponse.map((code: any) => ({
            codeId: `${txn.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            code: encrypt(code.cardNumber || code.code),
            pin: code.pinCode ? encrypt(code.pinCode) : null,
            redemptionUrl: code.redemptionUrl,
            status: "DELIVERED",
            deliveredAt: new Date().toISOString(),
          }));

          codesRetrieved += giftcardPurchaseCodes.length;

          const currentMeta = (txn.meta as any) || {};
          await prisma.transaction.update({
            where: { id: txn.id },
            data: {
              status: "SUCCESS",
              meta: {
                ...currentMeta,
                orderStatus: "SUCCESS",
                giftcardPurchaseCodes,
              },
            },
          });

          ordersCompleted++;

          logger.info(
            `✅ Successfully delivered ${codesResponse.length} code(s) for transaction ${txn.id}`,
          );
        } catch (error: any) {
          logger.error(
            `Failed to fetch codes for transaction ${txn.id}:`,
            error.message,
          );
        }
      }

      logger.info(
        `Giftcard code polling completed. Retrieved ${codesRetrieved} codes, completed ${ordersCompleted} orders.`,
      );
    } catch (error: any) {
      logger.error("Error in giftcard code polling job:", error.message);
    }
  });

  logger.info(
    "✅ Giftcard code polling cron job started (runs every 5 minutes)",
  );
}

export function startPendingGiftcardExpiration() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      logger.info("Starting pending giftcard expiration job...");

      const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000);

      const expiredTransactions = await prisma.transaction.findMany({
        where: {
          category: "GIFTCARDS",
          status: "PENDING",
          createdAt: {
            lte: fortyMinutesAgo,
          },
        },
      });

      if (expiredTransactions.length === 0) {
        logger.info("No expired pending gift card transactions found");
        return;
      }

      logger.info(
        `Found ${expiredTransactions.length} pending gift card transactions older than 40 minutes. Marking as FAILED.`,
      );

      for (const txn of expiredTransactions) {
        const currentMeta = (txn.meta as any) || {};
        await prisma.transaction.update({
          where: { id: txn.id },
          data: {
            status: "FAILED",
            meta: {
              ...currentMeta,
              orderStatus: "FAILED",
              failureReason: "Payment not completed within 40 minutes timeframe",
            },
          },
        });
        
        logger.info(`✅ Marked transaction ${txn.id} as FAILED due to timeout.`);
      }

      logger.info("Pending giftcard expiration job completed.");
    } catch (error: any) {
      logger.error("Error in pending giftcard expiration job:", error.message);
    }
  });

  logger.info(
    "✅ Pending giftcard expiration cron job started (runs every 10 minutes)",
  );
}
