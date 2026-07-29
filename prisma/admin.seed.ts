import { prisma } from "../src/shared/db/prisma";
import bcrypt from "bcrypt";
import { config } from "../src/shared/config/config";
import { logger } from '../src/lib/winston'

async function main() {
    logger.info("Starting the seeding process for super admin user.");

    const hashedPassword = await bcrypt.hash(config.admin.superPass, 10);
    logger.info("Password hashed successfully.");

    const superAdmin = await prisma.admin.create({
        // where: { email: "admin@myviel.com" },
        // update: {
        //     password: hashedPassword,
        //     name: "Super Trade Aviator",
        //     isSuper: true,
        //     isAdmin: true,
        // },
        // create:
        //  {
        data: {
            name: "Viel Admin",
            email: "admin@myviel.com",
            password: hashedPassword,
            isSuper: true,
            isAdmin: true,
        }
        // },
    });
    logger.info("✅ Super admin created:", superAdmin);
}

main()
    .catch((e) => {
        logger.error("❌ Error seeding super admin:", e);
        process.exit(1);
    })
    .finally(() => {
        logger.info("Seeding process completed. Disconnecting Prisma client.");
        prisma.$disconnect();
    });
