import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvOptional(key: string, defaultValue: string = ""): string {
    return process.env[key] || defaultValue;
}

function getEnvNumber(key: string): number {
    const value = getEnv(key);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(
            `Environment variable ${key} must be a valid number, got: ${value}`,
        );
    }
    return parsed;
}

function createConfig() {
    return {
        port: getEnvNumber("PORT"),
        env: getEnvOptional("env", "development") as
            | "production"
            | "development"
            | "test",

        database: {
            url: getEnv("DATABASE_URL"),
        },

        // appUrl: {
        //     baseUrl: getEnv("BASEAPP_URL"),
        // },

        jwt: {
            accessSecret: getEnv("JWT_ACCESS_SECRET"),
            refreshSecret: getEnv("JWT_REFRESH_SECRET"),
            accessTokenExpires: getEnvNumber("ACCESS_TOKEN_EXPIRES"),
            refreshTokenExpires: getEnvNumber("REFRESH_TOKEN_EXPIRES"),
        },

        redis: {
            url: getEnv("REDIS_URL"),
        },

        mail: {
            host: getEnv("MAIL_HOST"),
            port: getEnvNumber("MAIL_PORT"),
            username: getEnv("MAIL_USERNAME"),
            password: getEnv("MAIL_PASSWORD"),
        },

        queue: {
            url: getEnv("QUEUE_URL"),
            name: getEnv("QUEUE_NAME"),
            retryExchange: getEnv("RETRY_EXCHANGE"),
            retryQueue: getEnv("RETRY_QUEUE"),
            retryDelayMs: getEnvNumber("RETRY_DELAY_MS"),
            deadLetterQueue: getEnv("DEAD_LETTER_QUEUE_NAME"),
            maxRetries: getEnvNumber("QUEUE_MAX_RETRIES"),
        },

        obiex: {
            baseUrl: getEnv("OBIEX_URL"),
            secretKey: getEnv("OBIEX_SECRET_KEY"),
            publicKey: getEnv("OBIEX_PUBLIC_KEY"),
            webhookSecret: getEnv("OBIEX_WH_SECRET"),
        },

        // sudo: {
        //     apiKey: getEnv("SUDO_API_KEY"),
        //     baseUrl: getEnv("SUDO_BASE_URL"),
        //     accountId: getEnv("SUDO_ACCOUNTID"),
        // },
        // fireBase: {
        //     projectID: getEnv("FIREBASE_PROJECT_ID"),
        //     privateKey: getEnvOptional("FIREBASE_PRIVATE_KEY_PATH"),
        //     serviceAccount: getEnvOptional("FIREBASE_SERVICE_ACCOUNT"),
        // },
        reloadly: {
            clientID: getEnv("RELOADLY_CLIENT_ID"),
            clientSecret: getEnv("RELOADLY_CLIENT_SECRET"),
            baseUrl: getEnv("RELOADLY_API_URL"),
            environment: getEnv("RELOADLY_ENVIRONMENT"),
            // webhookSecret: getEnvOptional("RELOADLY_WEBHOOK_SECRET"),
        },
        encryption: {
            key: getEnv("ENCRYPTION_KEY"),
        },
        cloudinary: {
            name: getEnv("CLOUDINARY_CLOUD_NAME"),
            apiKey: getEnv("CLOUDINARY_API_KEY"),
            secretKey: getEnv("CLOUDINARY_API_SECRET"),
        },
        // admin: {
        //     superPass: getEnv("SUPER_ADMIN_PASS"),
        // },
    } as const;
}

const config = createConfig();

export type Config = typeof config;
export { config };
