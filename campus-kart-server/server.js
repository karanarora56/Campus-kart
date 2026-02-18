import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

// Route Imports
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Socket Handler Import
import setupSocketHandlers from './socket/socketHandlers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// --- SOCKET.IO CONFIG ---
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Pass the 'io' instance to your modular handlers
setupSocketHandlers(io);

// --- MIDDLEWARE ---
app.use(helmet()); 
app.use(cors({ 
  origin: frontendUrl, 
  credentials: true 
}));
app.use(express.json());
app.use(mongoSanitize());
app.use(cookieParser());

// --- ROUTES ---
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Campus Kart API is running in Midnight Mode...');
});

// --- DATABASE & START ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 NITJ Database Connected: ${conn.connection.host}`);
    
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🌙 Server glowing in Midnight Violet on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

export { io };
