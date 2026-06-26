import amqp, { ChannelModel } from "amqplib";
import { handleJob } from "./handlers";
import { config } from "../config/config";
import { logger } from "@/lib/winston";

export async function startWorker() {
    try {
        const queueUrl = config.queue.url;
        const isSecure = queueUrl.startsWith("amqps://");

        logger.info(`Connecting to RabbitMQ at ${queueUrl} (secure: ${isSecure})`);

        // For Amazon MQ (amqps), we need to configure TLS options
        const connectionOptions = isSecure ? {} : {};

        const connection: ChannelModel = await amqp.connect(queueUrl, connectionOptions);
        const channel = await connection.createChannel();

        try {
            await channel.deleteQueue(config.queue.retryQueue);
            await channel.deleteQueue(config.queue.name);
            await channel.deleteQueue(config.queue.deadLetterQueue);
            logger.info("Deleted existing queues to avoid conflicts");
        } catch (err) {
            logger.info(
                "Queues did not exist or could not be deleted, proceeding...",
            );
        }

        // 1. Setup retry exchange
        await channel.assertExchange(config.queue.retryExchange, "direct", {
            durable: true,
        });

        // 2. Setup dead letter queue (for permanently failed messages)
        await channel.assertQueue(config.queue.deadLetterQueue, {
            durable: true,
        });

        // 3. Setup retry queue
        await channel.assertQueue(config.queue.retryQueue, {
            durable: true,
            messageTtl: config.queue.retryDelayMs,
            deadLetterExchange: "",
            deadLetterRoutingKey: config.queue.name,
        });
        await channel.bindQueue(
            config.queue.retryQueue,
            config.queue.retryExchange,
            config.queue.retryQueue,
        );

        // 4. Main queue
        await channel.assertQueue(config.queue.name, {
            durable: true,
            deadLetterExchange: config.queue.retryExchange,
            deadLetterRoutingKey: config.queue.retryQueue,
        });

        logger.info(`Worker connected to queue "${config.queue.name}"`);
        logger.info(`Worker listening on queue "${config.queue.name}"`);

        channel.consume(config.queue.name, async (msg) => {
            if (!msg) return;

            logger.info(`Received raw message: ${msg.content.toString()}`);
            const job = JSON.parse(msg.content.toString());

            // Get retry count from message headers
            const retryCount = (msg.properties.headers?.["x-retry-count"] ||
                0) as number;

            logger.info(
                `Processing ${job.type} (attempt ${retryCount + 1}/${config.queue.maxRetries}) for ${job.payload?.recipient || job.payload?.txnId || job.payload?.userId || job.payload?.event?.creditAccountName || job.payload?.event?.requestId}`,
            );

            try {
                await handleJob(job);
                channel.ack(msg);
                logger.info(`✅ Completed ${job.type}`);
            } catch (err: any) {
                logger.error(`❌ Failed ${job.type}: ${err.message}`);

                if (retryCount < config.queue.maxRetries - 1) {
                    // Retry: send to retry queue with incremented count
                    logger.warn(
                        `Retrying ${job.type} (attempt ${retryCount + 2}/${config.queue.maxRetries})`,
                    );

                    channel.sendToQueue(
                        config.queue.retryQueue,
                        Buffer.from(JSON.stringify(job)),
                        {
                            persistent: true,
                            headers: {
                                "x-retry-count": retryCount + 1,
                                "x-original-queue": config.queue.name,
                                "x-first-death-reason": err.message,
                            },
                        },
                    );
                    channel.ack(msg); // Acknowledge to remove from main queue
                } else {
                    // Max retries reached: send to dead letter queue
                    logger.error(
                        `❌ Max retries reached for ${job.type}, sending to DLQ`,
                    );

                    channel.sendToQueue(
                        config.queue.deadLetterQueue,
                        Buffer.from(
                            JSON.stringify({
                                ...job,
                                failureReason: err.message,
                                retryCount,
                                failedAt: new Date().toISOString(),
                            }),
                        ),
                        {
                            persistent: true,
                            headers: {
                                "x-retry-count": retryCount,
                                "x-final-error": err.message,
                            },
                        },
                    );
                    channel.ack(msg); // Remove from main queue
                }
            }
        });

        // Handle connection events
        connection.on("close", () => {
            logger.error("❌ RabbitMQ connection closed unexpectedly");
            process.exit(1);
        });

        connection.on("error", (err) => {
            logger.error("❌ RabbitMQ connection error:", err);
        });
    } catch (err) {
        console.log(err);
        logger.error("❌ Worker crashed:");
        process.exit(1);
    }
}
