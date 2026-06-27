import Redis from "ioredis";
import { config } from "../config/config";
import { logger } from "@/lib/winston";


if (!config.redis.url || config.redis.url.trim() === "") {
    logger.error(
        "❌ REDIS_URL is not configured. Redis is required for this application.",
    );
    process.exit(1);
}

const redis = new Redis(config.redis.url);

logger.info("Checking Redis connection...");

redis.on("connect", () => {
    logger.info("✅ Redis connected");
});

redis.on("error", (err) => {
    logger.error("❌ Redis error", err);
    if (config.env === "production") {
        process.exit(1);
    }
});

export { redis };
