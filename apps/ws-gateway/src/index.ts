// server.ts (or your WebSocket gateway file)
import { WebSocket, WebSocketServer } from 'ws';
import Redis from 'ioredis';

const WS_PORT = 4000;
const REDIS_URL = 'redis://127.0.0.1:6379';

const wss = new WebSocketServer({ port: WS_PORT });
const redisSubscriber = new Redis(REDIS_URL);

// Subscribe to the correct channel
redisSubscriber.subscribe('sol-price');

redisSubscriber.on('message', (channel, message) => {
    if (channel === 'sol-price') {
        try {
            // FIX: Parse the message from Redis first
            const priceData = JSON.parse(message);

            // Create a new, clean payload specifically for the frontend
            const frontendPayload = JSON.stringify({
                price: priceData.price
            });

            // Send the clean payload to all connected clients
            wss.clients.forEach((client: WebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(frontendPayload);
                }
            });
            console.log(`Forwarded price ${priceData.price} to ${wss.clients.size} clients.`);

        } catch (error) {
            console.error('Failed to parse message from Redis or send to client:', error);
        }
    }
});

wss.on('connection', (ws: WebSocket) => {
    console.log('Frontend client connected.');
    ws.on('close', () => console.log('Frontend client disconnected.'));
    ws.on('error', (error) => console.error('WebSocket error:', error));
});

console.log(`WebSocket gateway started on port ${WS_PORT}.`);