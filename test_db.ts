import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const feeConfig = await prisma.feeConfiguration.findFirst({
        where: { type: "GIFTCARD_BUY" }
    });
    console.log("FeeConfig:", feeConfig);
}

main().catch(console.error).finally(() => prisma.$disconnect());
