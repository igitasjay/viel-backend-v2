import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export default async function initializeRedisClient() {
  if (client?.isOpen) {
    // Check if it's already open
    return client;
  }

  if (!client) {
    client = createClient({
      // Consider adding a URL from env variables
      url: process.env.REDIS_URL,
    });

    client.on('error', (err) => console.error('Redis Client Error', err));

    // It's good practice to catch errors on the initial connection
    try {
      await client.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      client = null; // Reset so next call retries
      throw err;
    }
  }

  return client;
}
