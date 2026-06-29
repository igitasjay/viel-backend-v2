import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedGiftcards() {
    console.log("🎁 Seeding accepted giftcards...");

    const giftcardsData: Prisma.AcceptedGiftCardCreateInput[] = [
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "United States",
            currency: "USD",
            availableRanges: ["$20-$99", "$100-$200", "$300-$500"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: {
                "$20-$99": { PHYSICAL: 1180, "E-CODE": 950 },
                "$100-$200": { PHYSICAL: 1195, "E-CODE": 1100 },
                "$300-$500": { PHYSICAL: 1250, "E-CODE": 1120 },
            },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },

        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Canada",
            currency: "CAD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 790 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "United Kingdom",
            currency: "GBP",
            availableRanges: ["£50-£500"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "£50-£500": { PHYSICAL: 1190, "E-CODE": 960 } },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "New Zealand",
            currency: "NZD",
            availableRanges: ["NZ$50-NZ$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "NZ$50-NZ$500": 622 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Germany",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "€50-€500": { PHYSICAL: 1035, "E-CODE": 1000 } },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Switzerland",
            currency: "CHF",
            availableRanges: ["CHF50-CHF500"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "CHF50-CHF500": { PHYSICAL: 1400, "E-CODE": 1320 } },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Italy",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1080 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Ireland",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1050 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Finland",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1100 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Netherlands",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1090 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Austria",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1095 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Spain",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1108 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Greece",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1070 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Portugal",
            currency: "EUR",
            availableRanges: ["€50-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€500": 1060 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "France",
            currency: "EUR",
            availableRanges: ["€50-€250"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€50-€250": 1100 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Apple/iTunes",
            cardType: "iTunes",
            country: "Australia",
            currency: "AUD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "$50-$500": { PHYSICAL: 690, "E-CODE": 650 } },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },

        // ==================== STEAM ====================
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "Germany",
            currency: "EUR",
            availableRanges: ["€20-€100"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "€20-€100": 1230 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "United States",
            currency: "USD",
            availableRanges: ["$20-$500"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "$20-$500": 1055 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "Italy",
            currency: "EUR",
            availableRanges: ["€20-€100"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "€20-€100": 1230 },
            imageUrl: "https://cdn.reloadly.com/giftcards/795088c7-da49-4cfa-a631-e1cc2ff6b089.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "Canada",
            currency: "CAD",
            availableRanges: ["$20-$200"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "$20-$200": 745 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "Australia",
            currency: "AUD",
            availableRanges: ["$20-$200"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "$20-$200": 675 },
            imageUrl: "https://cdn.reloadly.com/giftcards/795088c7-da49-4cfa-a631-e1cc2ff6b089.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "United Kingdom",
            currency: "GBP",
            availableRanges: ["£20-£200"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "£20-£200": 1400 },
            imageUrl: "https://cdn.reloadly.com/giftcards/08ed62a9-52d3-47d2-9ad8-ae27d0a3f3a2.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "Switzerland",
            currency: "CHF",
            availableRanges: ["CHF20-CHF200"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "CHF20-CHF200": 1313 },
            imageUrl: "https://cdn.reloadly.com/giftcards/795088c7-da49-4cfa-a631-e1cc2ff6b089.png",
            isActive: true,
        },
        {
            cardName: "Steam",
            cardType: "Steam",
            country: "New Zealand",
            currency: "NZD",
            availableRanges: ["NZ$20-NZ$200"],
            receiptTypes: ["PHYSICAL", "E-CODE"],
            rates: { "NZ$20-NZ$200": 560 },
            imageUrl: "https://cdn.reloadly.com/giftcards/795088c7-da49-4cfa-a631-e1cc2ff6b089.png",
            isActive: true,
        },

        // ==================== OTHER BRANDS ====================
        {
            cardName: "Sephora",
            cardType: "Sephora",
            country: "United States",
            currency: "USD",
            availableRanges: ["$100-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$100-$500": 1100 },
            imageUrl: "https://cdn.reloadly.com/giftcards/cc58ae75-36e4-4275-922a-862d6afcf9c5.png",
            isActive: true,
        },
        {
            cardName: "Macy's",
            cardType: "Macy's",
            country: "United States",
            currency: "USD",
            availableRanges: ["$100-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$100-$500": 1145 },
            imageUrl: "https://slimages.macysassets.com/is/image/MCY/products/2/optimized/20880512_fpx.tif?op_sharpen=1&wid=1500&fit=fit%2C1&fmt=webp",
            isActive: true,
        },
        {
            cardName: "Nordstrom",
            cardType: "Nordstrom",
            country: "United States",
            currency: "USD",
            availableRanges: ["$100-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$100-$500": 825 },
            imageUrl: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6389/6389631_sd.jpg;maxHeight=1920;maxWidth=900?format=webp",
            isActive: true,
        },

        // ==================== RAZER GOLD ====================
        {
            cardName: "Razer Gold",
            cardType: "Razer Gold",
            country: "United States",
            currency: "USD",
            availableRanges: ["$20-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$20-$500": 1180 },
            imageUrl: "https://cdn.reloadly.com/giftcards/razer-gold.png",
            isActive: true,
        },
        {
            cardName: "Razer Gold",
            cardType: "Razer Gold",
            country: "Canada",
            currency: "CAD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 820 },
            imageUrl: "https://cdn.reloadly.com/giftcards/razer-gold.png",
            isActive: true,
        },
        {
            cardName: "Razer Gold",
            cardType: "Razer Gold",
            country: "Brazil",
            currency: "BRL",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 190 },
            imageUrl: "https://cdn.reloadly.com/giftcards/razer-gold.png",
            isActive: true,
        },
        {
            cardName: "Razer Gold",
            cardType: "Razer Gold",
            country: "Singapore",
            currency: "SGD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 885 },
            imageUrl: "https://cdn.reloadly.com/giftcards/razer-gold.png",
            isActive: true,
        },
        {
            cardName: "Razer Gold",
            cardType: "Razer Gold",
            country: "Australia",
            currency: "AUD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 755 },
            imageUrl: "https://cdn.reloadly.com/giftcards/razer-gold.png",
            isActive: true,
        },
        {
            cardName: "Razer Gold",
            cardType: "Razer Gold",
            country: "New Zealand",
            currency: "NZD",
            availableRanges: ["NZ$25-NZ$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "NZ$25-NZ$500": 630 },
            imageUrl: "https://cdn.reloadly.com/giftcards/razer-gold.png",
            isActive: true,
        },

        // ==================== XBOX ====================
        {
            cardName: "Xbox",
            cardType: "Xbox",
            country: "United States",
            currency: "USD",
            availableRanges: ["$25-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$25-$500": 1090 },
            imageUrl: "https://cdn.reloadly.com/giftcards/28c35815-9fdc-4d29-91c6-73e6e3b2303d.png",
            isActive: true,
        },
        {
            cardName: "Xbox",
            cardType: "Xbox",
            country: "United Kingdom",
            currency: "GBP",
            availableRanges: ["£25-£500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "£25-£500": 1110 },
            imageUrl: "https://cdn.reloadly.com/giftcards/28c35815-9fdc-4d29-91c6-73e6e3b2303d.png",
            isActive: true,
        },
        {
            cardName: "Xbox",
            cardType: "Xbox",
            country: "Canada",
            currency: "CAD",
            availableRanges: ["$25-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$25-$500": 710 },
            imageUrl: "https://cdn.reloadly.com/giftcards/28c35815-9fdc-4d29-91c6-73e6e3b2303d.png",
            isActive: true,
        },
        {
            cardName: "Xbox",
            cardType: "Xbox",
            country: "Germany",
            currency: "EUR",
            availableRanges: ["€25-€500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "€25-€500": 1120 },
            imageUrl: "https://cdn.reloadly.com/giftcards/795088c7-da49-4cfa-a631-e1cc2ff6b089.png",
            isActive: true,
        },

        // ==================== AMERICAN EXPRESS ====================
        {
            cardName: "American Express (3779)",
            cardType: "American Express",
            country: "United States",
            currency: "USD",
            availableRanges: ["$100-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$100-$500": 1005 },
            imageUrl: "https://cdn.reloadly.com/giftcards/28c35815-9fdc-4d29-91c6-73e6e3b2303d.png",
            isActive: true,
        },

        // ==================== FOOTLOCKER ====================
        {
            cardName: "Footlocker",
            cardType: "Footlocker",
            country: "United States",
            currency: "USD",
            availableRanges: ["$100-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$100-$500": 1205 },
            imageUrl: "https://cdn.reloadly.com/giftcards/21b5be3b-bf32-496c-8dc0-0fb7342dcdfc.png",
            isActive: true,
        },

        // ==================== EBAY ====================
        // {
        //   cardName: "eBay",
        //   cardType: "eBay",
        //   country: "United States",
        //   currency: "USD",
        //   availableRanges: ["$25-$500"],
        //   receiptTypes: ["PHYSICAL"],
        //   rates: { "$25-$500": 1000 },
        //   imageUrl: "https://legitcards.com.ng/imgs/ebaycard.jpg",
        //   isActive: true,
        // },

        // ==================== CVS ====================
        {
            cardName: "CVS",
            cardType: "CVS",
            country: "United States",
            currency: "USD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 1170 },
            imageUrl: "https://www.giftcardpartners.com/hs-fs/file-2469481155-png/client_gift_cards/cvs-select.png?width=675&name=cvs-select.png",
            isActive: true,
        },

        // ==================== PLAYSTATION ====================
        {
            cardName: "PlayStation",
            cardType: "PlayStation",
            country: "United States",
            currency: "USD",
            availableRanges: ["$50-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$50-$500": 900 },
            imageUrl: "https://i5.walmartimages.com/seo/PlayStation-Store-25-eGift-Card-Digital_e7db1c03-a2fd-4eec-978b-93494cd98afd.f2e47fa7464d1180f35f30d8c306f406.png?odnHeight=573&odnWidth=573&odnBg=FFFFFF",
            isActive: true,
        },

        // ==================== GAMESTOP ====================
        {
            cardName: "GameStop",
            cardType: "GameStop",
            country: "United States",
            currency: "USD",
            availableRanges: ["$100-$500"],
            receiptTypes: ["PHYSICAL"],
            rates: { "$100-$500": 1200 },
            imageUrl: "https://blog.giftcard8.com/wp-content/uploads/2025/03/have-a-GameStop-gift-card-980x377.jpg",
            isActive: true,
        },
        // {
        //   cardName: "Target",
        //   cardType: "Target",
        //   country: "",
        //   currency: "",
        //   availableRanges: [],
        //   receiptTypes: [],
        //   rates: {},
        //   imageUrl: "https://cdn.reloadly.com/giftcards/4ba0f8b8-2958-46aa-a47c-3698d8d12867.png",
        //   isActive: true,
        // },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const cardData of giftcardsData) {
        try {
            const existing = await prisma.acceptedGiftCard.findUnique({
                where: {
                    cardType_country: {
                        cardType: cardData.cardType,
                        country: cardData.country,
                    },
                },
            });

            if (existing) {
                await prisma.acceptedGiftCard.update({
                    where: {
                        cardType_country: {
                            cardType: cardData.cardType,
                            country: cardData.country,
                        },
                    },
                    data: cardData,
                });
                console.log(`   🔄 Updated: ${cardData.cardType} (${cardData.country})`);
                skippedCount++;
                continue;
            }

            await prisma.acceptedGiftCard.create({ data: cardData });
            console.log(`   ✅ Created: ${cardData.cardType} (${cardData.country})`);
            createdCount++;
        } catch (error) {
            console.error(`   ❌ Error creating ${cardData.cardType} (${cardData.country}):`, error);
        }
    }

    console.log(`\n🎉 Giftcard seeding completed! Created: ${createdCount}, Updated: ${skippedCount}, Total: ${giftcardsData.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedGiftcards()
        .then(() => {
            console.log("✅ Seeding finished successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Seeding failed:", error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
