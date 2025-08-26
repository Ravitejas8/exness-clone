import express from "express";
import type { Express, Request, Response } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import cors from 'cors';
import { z } from 'zod';

import { db } from "@project1/db"; // <-- Corrected import

const app: Express = express();
app.use(express.json());
app.use(cors());

// Schemas for request validation
const signUpSchema = z.object({
    userId: z.string().min(3, "User ID must be at least 3 characters long."),
    password: z.string().min(6, "Password must be at least 6 characters long."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
});

const signInSchema = z.object({
    userId: z.string(),
    password: z.string(),
});

const orderSchema = z.object({
    type: z.enum(["buy", "sell"]),
    qty: z.number().positive(),
    asset: z.string(),
    stopLoss: z.number().optional(),
    takeProfit: z.number().optional(),
});

// Middleware for authentication
const authenticateUser = async (req: Request, res: Response, next: any) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await db.user.findUnique({ where: { userId } }); // <-- Corrected call
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    (req as any).user = user;
    next();
};

// Endpoints
app.post("/signup", async (req: Request, res: Response) => {
    try {
        const { userId, password, firstName, lastName } = signUpSchema.parse(req.body);
        const existingUser = await db.user.findUnique({ where: { userId } }); // <-- Corrected call

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const newUser = await db.user.create({ // <-- Corrected call
            data: {
                userId,
                password,
                firstName,
                lastName,
                balances: {
                    usd: { qty: 5000 }
                }
            }
        });

        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error: any) {
        return res.status(400).json({ message: error.issues });
    }
});

app.post("/signin", async (req: Request, res: Response) => {
    try {
        const { userId, password } = signInSchema.parse(req.body);
        const user = await db.user.findUnique({ where: { userId } }); // <-- Corrected call

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).json({ message: "Signed in successfully", user });
    } catch (error: any) {
        return res.status(400).json({ message: error.issues });
    }
});

app.get("/candles", async (req: Request, res: Response) => {
    const { asset, duration, startTime, endTime } = req.query;

    // Validate query parameters
    if (!asset || !duration) {
        return res.status(400).json({ message: "Asset and duration are required." });
    }

    const candles = await db.candle.findMany({ // <-- Corrected call
        where: {
            assetName: String(asset),
            timestamp: {
                gte: startTime ? new Date(String(startTime)) : undefined,
                lte: endTime ? new Date(String(endTime)) : undefined,
            },
        },
        orderBy: {
            timestamp: 'asc',
        }
    });

    return res.status(200).json(candles);
});

app.get("/balance", authenticateUser, async (req: Request, res: Response) => {
    const user = (req as any).user;
    return res.status(200).json({ balances: user.balances });
});

app.post("/order/open", authenticateUser, async (req: Request, res: Response) => {
    try {
        const { type, qty, asset, stopLoss, takeProfit } = orderSchema.parse(req.body);
        const user = (req as any).user;

        // Simplified logic: Check for sufficient balance
        const balance = (user.balances as any).usd.qty;
        if (type === "buy" && balance < qty) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Create new order
        const newOrder = await db.order.create({ // <-- Corrected call
            data: {
                userId: user.id,
                asset,
                qty,
                type,
                status: "open",
                openPrice: 100, // Placeholder
                stopLoss,
                takeProfit,
            },
        });

        // Update user balance (simplified)
        const updatedBalances = { ...user.balances, usd: { qty: balance - qty } };
        const updatedUser = await db.user.update({ // <-- Corrected call
            where: { id: user.id },
            data: { balances: updatedBalances },
        });

        return res.status(200).json({
            orderId: newOrder.id,
            balance: updatedUser.balances,
        });

    } catch (error: any) {
        return res.status(400).json({ message: error.issues || error.message });
    }
});

app.post("/order/close", authenticateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        const user = (req as any).user;

        const order = await db.order.findUnique({ where: { id } }); // <-- Corrected call
        if (!order || order.userId !== user.id || order.status !== "open") {
            return res.status(404).json({ message: "Order not found or already closed." });
        }

        // Update order status and add close price
        const closedOrder = await db.order.update({ // <-- Corrected call
            where: { id },
            data: { status: "closed", closedAt: new Date(), closePrice: 110 }, // Placeholder close price
        });

        // Update user balance (simplified, for example, return funds)
        const updatedBalances = { ...user.balances, usd: { qty: (user.balances as any).usd.qty + order.qty } };
        const updatedUser = await db.user.update({ // <-- Corrected call
            where: { id: user.id },
            data: { balances: updatedBalances },
        });

        return res.status(200).json({
            orderId: closedOrder.id,
            balance: updatedUser.balances,
        });

    } catch (error: any) {
        return res.status(400).json({ message: error.issues || error.message });
    }
});

app.get("/orders", authenticateUser, async (req: Request, res: Response) => {
    const user = (req as any).user;

    const orders = await db.order.findMany({ // <-- Corrected call
        where: { userId: user.id },
        select: { asset: true, qty: true, type: true, status: true, openPrice: true, closedAt: true, closePrice: true }
    });

    return res.status(200).json(orders);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Backend service listening at http://localhost:${port}`);
});