// polling-service.js
import WebSocket from 'ws';
import Redis from 'ioredis';

// --- Configuration (Interval is still configurable) ---
const INTERVAL = process.env.INTERVAL || '5m';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// ---

// --- Hardcoded Solana Configuration ---
const BINANCE_ASSET_PAIR = 'solusdt';
const INTERNAL_ASSET_NAME = 'solana';
// ---

const BINANCE_WS_URL = `wss://stream.binance.com:9443/ws/${BINANCE_ASSET_PAIR}@kline_${INTERVAL}`;
const REDIS_CHANNEL = `candles:${INTERNAL_ASSET_NAME}:${INTERVAL}`; // e.g., "candles:solana:5m"

const redisPublisher = new Redis(REDIS_URL);
const binanceWs = new WebSocket(BINANCE_WS_URL);

redisPublisher.on('ready', () => {
    console.log(`[${INTERVAL} Solana Poller] ✅ Connected to Redis. Publishing to '${REDIS_CHANNEL}'.`);
});

redisPublisher.on('error', (err) => {
    console.error(`[${INTERVAL} Solana Poller] ❌ Redis connection error:`, err);
});

binanceWs.onopen = () => {
    console.log(`[${INTERVAL} Solana Poller] ✅ Connected to Binance. Listening for ${BINANCE_ASSET_PAIR}@kline_${INTERVAL}...`);
};

binanceWs.onmessage = async (event) => {
    const data = JSON.parse(event.data.toString());
    const candle = data.k;

    if (candle && candle.x) { // Only publish finalized/closed candles
        const message = JSON.stringify(candle);
        try {
            await redisPublisher.publish(REDIS_CHANNEL, message);
            console.log(`[${INTERVAL} Solana Poller] 👉 Published Solana candle. Timestamp: ${new Date(candle.T).toLocaleTimeString()}`);
        } catch (err) {
            console.error(`[${INTERVAL} Solana Poller] ❌ Failed to publish to Redis:`, err);
        }
    }
};

binanceWs.onclose = () => {
    console.log(`[${INTERVAL} Solana Poller] 🔌 Disconnected from Binance.`);
};

process.on('SIGINT', () => {
    binanceWs.close();
    redisPublisher.quit();
    process.exit();
});