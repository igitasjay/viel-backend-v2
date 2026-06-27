import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "../config/config";

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    const client = new PrismaClient({ adapter }).$extends({
        query: {
            user: {
                async findUnique({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
                async findMany({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
                async update({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
                async updateMany({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
                async delete({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
                async deleteMany({ args, query }) {
                    args.where = { ...args.where, deletedAt: null };
                    return query(args);
                },
            },
        },
    });

    return client;
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prismaGlobal: ExtendedPrismaClient | undefined;
};

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

if (config.env !== "production") globalForPrisma.prismaGlobal = prisma;

export { prisma };
