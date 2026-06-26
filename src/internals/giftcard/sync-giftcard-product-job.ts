import cron from "node-cron";
import { reloadlyService } from "@/externals/reloadly/reloadly";
import { logger } from "@/lib/winston";

export const startProductSyncJob = () => {
    // Cron format: minute hour day month weekday
    // '0 3 * * *' = Every day at 3:00 AM
    cron.schedule("0 3 * * *", async () => {
        try {
            logger.info("Starting scheduled gift card product sync...");

            const result = await reloadlyService.syncProductsToDatabase();

            logger.info("Scheduled product sync completed:", {
                synced: result.synced,
                errors: result.errors,
                timestamp: new Date().toISOString(),
            });

            if (result.errors > 0) {
                logger.warn(`Product sync completed with ${result.errors} errors`);
                // TODO: Send notification to admin
            }
        } catch (error) {
            logger.error("Scheduled product sync failed:", error as any);
            // TODO: Alert admin about sync failure
        }
    });

    logger.info("Gift card product sync job scheduled (daily at 3:00 AM)");
};
