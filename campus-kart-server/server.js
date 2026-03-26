import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit'; // <--- ADDED RATE LIMITER

// --- ROUTE IMPORTS ---
import adminRoutes from './src/routes/adminRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

// --- SOCKET & REDIS IMPORTS ---
import setupSocketHandlers from './socket/socketHandlers.js';
import { redisClient } from './src/config/redis.js'; // <--- ADDED REDIS CONNECTION

const app = express();
app.set('trust proxy', 1);

const httpServer = createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

setupSocketHandlers(io);

// --- CONNECT TO REDIS ---
await redisClient.connect();

// --- MIDDLEWARE ---
app.use(helmet()); 
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(mongoSanitize());
app.use(cookieParser());

// --- ENTERPRISE RATE LIMITER (Security) ---
// Limits users/bots to 20 login/register attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply the limiter ONLY to the auth routes
app.use('/api/auth', authLimiter);

// --- ROUTES ---
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Campus Kart API is running in Midnight Mode...');
});

// --- DATABASE & START (CLEANED) ---
const startServer = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 NITJ Database Connected: ${conn.connection.host}`);
    
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🌙 Server glowing in Midnight Violet on port ${PORT}`);
    });
    console.log("📧 Mailer User:", process.env.EMAIL_USER);
    console.log("🔑 Mailer Pass Loaded:", process.env.EMAIL_PASS ? "YES" : "NO");
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export { io };