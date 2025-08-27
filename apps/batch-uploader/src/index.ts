import { db } from "@project1/db";
import { Redis } from "ioredis";

// 1. Define the shape of the candle object in your buffer
interface BufferCandle {
    t: number;  // Kline start time (timestamp)
    o: string;  // Open price
    h: string;  // High price
    l: string;  // Low price
    c: string;  // Close price
    interval: string; // The interval you add manually
}

// FIX: Corrected the IP address from 1.0.0.1 to 127.0.0.1
const REDIS_URL = 'redis://127.0.0.1:6379';
const BATCH_INTERVAL_MS = 5000;

const redisSubscriber = new Redis(REDIS_URL);
redisSubscriber.psubscribe('candles:solana:*');

const dataBuffer: BufferCandle[] = [];
let isProcessing = false;

redisSubscriber.on('pmessage', (pattern, channel, message) => {
    try {
        const candleData = JSON.parse(message);
        const [, , interval] = channel.split(':');

        if (interval) {
            dataBuffer.push({ ...candleData, interval });
        }
    } catch (error) {
        console.error("Error processing Redis message:", error);
    }
});

const processBatch = async () => {
    if (dataBuffer.length === 0 || isProcessing) return;

    isProcessing = true;
    const batch = dataBuffer.splice(0, dataBuffer.length);
    console.log(`Processing batch of ${batch.length} Solana candles.`);

    try {
        const formattedBatch = batch.map(c => ({
            timestamp: new Date(c.t),
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
            assetName: 'solana',
            interval: c.interval,
        }));

        await db.candle.createMany({
            data: formattedBatch,
            skipDuplicates: true,
        });

        console.log(`✅ Processed ${batch.length} candles.`);
    } catch (error) {
        console.error("❌ Failed to insert batch. Re-queueing data.", error);
        dataBuffer.unshift(...batch);
    } finally {
        isProcessing = false;
    }
};

setInterval(processBatch, BATCH_INTERVAL_MS);
console.log('🚀 Solana Batch Uploader started. Subscribed to "candles:solana:*" pattern.');