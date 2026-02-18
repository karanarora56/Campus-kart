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

// --- ROUTE IMPORTS ---
import adminRoutes from './src/routes/adminRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

// --- SOCKET HANDLER IMPORT ---
import setupSocketHandlers from './socket/socketHandlers.js';



const app = express();
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

// --- MIDDLEWARE ---
app.use(helmet()); 
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(mongoSanitize());
app.use(cookieParser());

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