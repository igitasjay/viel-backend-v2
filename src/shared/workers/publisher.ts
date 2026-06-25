import amqplib from "amqplib";
import type { ChannelModel, Channel } from "amqplib";
import { logger } from "@/lib/winston";
import { config } from "@/shared/config/config";

let connection!: ChannelModel;
let channel!: Channel;

export const initPublisher = async (): Promise<void> => {
    try {
        const queueUrl = config.queue.url;
        const isSecure = queueUrl.startsWith("amqps://");

        logger.info(`Connecting to RabbitMQ at ${queueUrl} (secure: ${isSecure})`);

        const connectionOptions = isSecure ? {
        } : {};

        connection = await amqplib.connect(queueUrl, connectionOptions);
        channel = await connection.createChannel();

        await channel.assertQueue(config.queue.name, {
            durable: true,
            deadLetterExchange: config.queue.retryExchange,
            deadLetterRoutingKey: config.queue.retryQueue,
        });

        logger.info(`Publisher connected to queue "${config.queue.name}"`);

        connection.on("close", () => {
            logger.error("❌ RabbitMQ connection closed. Reconnecting...");
            setTimeout(initPublisher, 5000);
        });

        connection.on("error", (err) => {
            logger.error("❌ RabbitMQ connection error:", err);
        });
    } catch (error) {
        logger.error("❌ Failed to initialize publisher:");
        throw error;
    }
};

export const publishToQueue = async (jobData: Record<string, any>) => {
    if (!channel) {
        logger.warn("Publisher not initialized, reinitializing...");
        await initPublisher();
    }

    try {
        const payload = JSON.stringify(jobData);
        logger.info(`Publishing to "${config.queue.name}"`, jobData);

        const sent = channel.sendToQueue(config.queue.name, Buffer.from(payload), {
            persistent: true,
            headers: {
                "x-retry-count": 0,
            },
        });

        if (!sent) {
            logger.warn("Message was not sent to the queue (backpressure).");
        }

        return sent;
    } catch (error) {
        logger.error("Failed to publish job:");
        throw error;
    }
};

export const closePublisher = async () => {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        logger.info("Publisher connection closed");
    } catch (err) {
        logger.error("❌ Error closing publisher:");
    }
};
