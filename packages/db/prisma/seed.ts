// packages/db/prisma/seed.ts
import { db } from "../index";

async function main() {
    console.log(`Start seeding ...`);

    // Seed User Data
    const user = await db.user.upsert({
        where: { userId: "rt10" },
        update: {},
        create: {
            userId: "rt10",
            password: "ravitejas",
            firstName: "Ravi",
            lastName: "Tejas",
            balances: {
                usd: { qty: 5000 }
            }
        },
    });
    console.log(`Seeded user with ID: ${user.id}`);

    // Seed Timeseries Data (Candles)
    const candles = [
        {
            timestamp: new Date("2025-08-25T10:00:00Z"),
            open: 100, high: 110, low: 95, close: 105,
            assetName: "sol",
            color: "green",
            label: "10:00"
        },
        {
            timestamp: new Date("2025-08-25T10:05:00Z"),
            open: 105, high: 120, low: 102, close: 115,
            assetName: "sol",
            color: "green",
            label: "10:05"
        },
        {
            timestamp: new Date("2025-08-25T10:10:00Z"),
            open: 115, high: 118, low: 108, close: 112,
            assetName: "sol",
            color: "red",
            label: "10:10"
        },
    ];

    for (const candleData of candles) {
        await db.candle.upsert({
            where: { timestamp: candleData.timestamp },
            update: {},
            create: candleData,
        });
    }
    console.log("Seeded timeseries data for 'sol'");

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });