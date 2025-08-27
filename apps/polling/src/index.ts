import WebSocket from 'ws';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/solusdt@trade';

const redisPublisher = new Redis(REDIS_URL);
const binanceWs = new WebSocket(BINANCE_WS_URL);

console.log('Connecting to Binance WebSocket...');

binanceWs.onopen = () => {
    console.log('Connected to Binance WebSocket. Listening for SOLUSDT price...');
};

binanceWs.onmessage = async (event) => {
    const data = JSON.parse(event.data as string);
    const price = data.p; // 'p' is the price in the Binance trade stream

    if (price) {
        const message = JSON.stringify({ asset: 'solana', price: parseFloat(price) });

        // Publish the price to the 'sol-price' Redis channel
        redisPublisher.publish('sol-price', message);
        console.log(`Published new price to Redis: ${price}`);
    }
};

binanceWs.onclose = () => {
    console.log('Disconnected from Binance WebSocket.');
};

binanceWs.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    binanceWs.close();
    redisPublisher.quit();
    process.exit();
});