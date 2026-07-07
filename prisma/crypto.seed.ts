import { prisma } from "../src/shared/db/prisma";

const CRYPTO_ASSETS_DATA = [
    // { code: "ACT", name: "Act I : The AI Prophecy", image: "https://assets.coingecko.com/coins/images/35942/large/act.png" },
    // { code: "ADA", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
    // { code: "ARB", name: "Arbitrum", image: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg" },
    // { code: "AVAX", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png" },
    // { code: "AXS", name: "Axie Infinity", image: "https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png" },
    {
        code: "BCH",
        name: "Bitcoin Cash",
        image:
            "https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png",
    },
    {
        code: "BNB",
        name: "Binance Coin",
        image:
            "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    },
    {
        code: "BTC",
        name: "Bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    },
    // { code: "BUSD", name: "Binance USD", image: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png" },
    // { code: "CNGN", name: "cNGN", image: "https://assets.coingecko.com/coins/images/31990/large/cNGN_Logo.png" },
    // { code: "DAI", name: "DAI", image: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png" },
    {
        code: "DOGE",
        name: "Dogecoin",
        image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    },
    // { code: "EIGEN", name: "Eigen Layer", image: "https://assets.coingecko.com/coins/images/37788/large/eigen.png" },
    {
        code: "ETH",
        name: "Ethereum",
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    },
    // { code: "FLOKI", name: "Floki", image: "https://assets.coingecko.com/coins/images/16746/large/PNG_image.png" },
    // { code: "GHS", name: "Ghanaian Cedi", image: "https://via.placeholder.com/200?text=GHS" },
    {
        code: "LTC",
        name: "Litecoin",
        image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
    },
    {
        code: "MATIC",
        name: "Polygon",
        image:
            "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    },
    // { code: "MEME", name: "Memecoin", image: "https://assets.coingecko.com/coins/images/32512/large/memecoin.jpg" },
    // { code: "PEPE", name: "Pepe", image: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg" },
    // { code: "PNUT", name: "Peanut The Squirrel", image: "https://assets.coingecko.com/coins/images/38399/large/pnut.jpg" },
    {
        code: "POL",
        name: "Polygon",
        image:
            "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    },
    {
        code: "SHIB",
        name: "Shiba Inu",
        image: "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
    },
    {
        code: "SOL",
        name: "Solana",
        image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    },
    // { code: "SUI", name: "Sui", image: "https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg" },
    // { code: "TON", name: "Toncoin", image: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png" },
    // { code: "TRUMP", name: "Official Trump", image: "https://assets.coingecko.com/coins/images/44019/large/official-trump.png" },
    {
        code: "TRX",
        name: "Tron",
        image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
    },
    // { code: "TST", name: "Test Currency", image: "https://via.placeholder.com/200?text=TST" },
    {
        code: "USDC",
        name: "USD Coin",
        image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    },
    {
        code: "USDT",
        name: "Tether",
        image:
            "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
    },
    // { code: "WKD", name: "Wakanda Inu", image: "https://via.placeholder.com/200?text=WKD" },
    // { code: "WLD", name: "Worldcoin", image: "https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg" }
];

export async function seedCryptoAssets() {
    console.log("🚀 Seeding crypto assets...");

    const activeCodes = CRYPTO_ASSETS_DATA.map((asset) => asset.code);

    // Delete crypto assets that are not in the active list
    const deleted = await prisma.cryptoAsset.deleteMany({
        where: {
            code: {
                notIn: activeCodes,
            },
        },
    });

    console.log(`🗑️  Deleted ${deleted.count} crypto assets not in active list`);

    // Upsert all active crypto assets
    for (const asset of CRYPTO_ASSETS_DATA) {
        await prisma.cryptoAsset.upsert({
            where: { code: asset.code },
            update: {
                name: asset.name,
                imageUrl: asset.image,
                isActive: true,
                buyRate: 1000,
            },
            create: {
                code: asset.code,
                name: asset.name,
                imageUrl: asset.image,
                isActive: true,
                buyRate: 1000,
            },
        });
    }

    console.log(
        `✅ Seeded ${CRYPTO_ASSETS_DATA.length} crypto assets successfully!`,
    );
    console.log(
        `✅ Seeded ${CRYPTO_ASSETS_DATA.map((a) => a.code).join(", ")} crypto assets successfully!`,
    );
}

if (require.main === module) {
    seedCryptoAssets()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
