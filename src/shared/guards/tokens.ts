import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { logger } from "@/lib/winston";
import { redis } from "../common/redis";

type TokenType = "user" | "admin";

type DecodedToken<T = AuthUser | AuthAdmin> = {
    payload: T;
    type: TokenType;
    exp: number;
    iat?: number;
};

export class TokenService {
    static generateUserToken(payload: AuthUser): string {
        return jwt.sign({ payload, type: "user" }, config.jwt.accessSecret, {
            expiresIn: `${config.jwt.accessTokenExpires}d`,
            algorithm: "HS256",
        });
    }

    static verifyUserToken(token: string): AuthUser {
        const decoded = jwt.verify(token, config.jwt.accessSecret) as {
            payload: AuthUser;
            type: TokenType;
        };

        if (decoded.type !== "user") {
            throw new Error("Invalid token type - expected user token");
        }

        return decoded.payload;
    }

    static generateUserRefreshToken(payload: AuthUser): string {
        return jwt.sign({ payload, type: "user" }, config.jwt.refreshSecret, {
            expiresIn: `${config.jwt.refreshTokenExpires}m`,
        });
    }

    static verifyUserRefreshToken(token: string): AuthUser {
        const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
            payload: AuthUser;
            type: TokenType;
        };

        if (decoded.type !== "user") {
            throw new Error("Invalid refresh token type - expected user token");
        }

        return decoded.payload;
    }

    static async invalidateTokens(userId: string, accessToken?: string) {
        if (accessToken) {
            try {
                const decoded: any = TokenService.decodeToken(accessToken);
                logger.info(`Decoded token for user ${userId}:`, decoded);

                if (decoded?.exp) {
                    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                    logger.info(`Token TTL: ${ttl} seconds`);

                    if (ttl > 0) {
                        await redis.setex(`bl_access:${accessToken}`, ttl, "true");
                        logger.info(
                            `Token blacklisted: bl_access:${accessToken.substring(0, 20)}...`,
                        );
                        const check = await redis.get(`bl_access:${accessToken}`);
                        logger.info(`Verification - Token in blacklist: ${check}`);
                    } else {
                        logger.warn(`Token already expired, TTL: ${ttl}`);
                    }
                }
            } catch (error) {
                logger.error(`Failed to decode/blacklist token for user ${userId}:`);
            }
        }
        await redis.del(`refresh:${userId}`);
        logger.info(`Tokens invalidated for user ${userId}`);
    }

    static decodeToken(token: string): DecodedToken | null {
        return jwt.decode(token) as DecodedToken | null;
    }

    static generateAdminToken(payload: AuthAdmin): string {
        return jwt.sign({ payload, type: "admin" }, config.jwt.accessSecret, {
            expiresIn: `${config.jwt.accessTokenExpires}h`,
            algorithm: "HS256",
        });
    }

    static async verifyAdminToken(token: string): Promise<AuthAdmin> {
        const isBlacklisted = await redis.get(`bl_access:${token}`);
        if (isBlacklisted) throw new Error("Token has been invalidated");

        const decoded = jwt.verify(token, config.jwt.accessSecret) as {
            payload: AuthAdmin;
            type: TokenType;
        };

        if (decoded.type !== "admin") {
            throw new Error("Invalid token type - expected admin token");
        }
        return decoded.payload;
    }

    static generateAdminRefreshToken(payload: AuthAdmin): string {
        return jwt.sign({ payload, type: "admin" }, config.jwt.refreshSecret, {
            expiresIn: `${config.jwt.refreshTokenExpires}h`,
        });
    }

    static verifyAdminRefreshToken(token: string): AuthAdmin {
        const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
            payload: AuthAdmin;
            type: TokenType;
        };

        if (decoded.type !== "admin") {
            throw new Error("Invalid refresh token type - expected admin token");
        }
        return decoded.payload;
    }

    // Invalidate access + refresh tokens
    static async invalidateAdminTokens(userId: string, accessToken?: string) {
        if (accessToken) {
            const decoded: any = TokenService.decodeToken(accessToken);
            if (decoded?.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redis.setex(`bl_access:${accessToken}`, ttl, "true");
                }
            }
        }
        // Delete refresh token record
        await redis.del(`refresh:${userId}`);
    }

    // Decode without verifying
    static decodeAdminToken(token: string): DecodedToken | null {
        return jwt.decode(token) as DecodedToken | null;
    }
}
