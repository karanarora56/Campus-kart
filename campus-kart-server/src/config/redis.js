// config/redis.js
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error ❌', err));
redisClient.on('connect', () => console.log('Redis Enterprise Cache Connected 🚀'));

// Helper function to wipe the cache whenever a new item is posted or sold
export const clearProductCache = async () => {
  try {
    // Wipes the cache so the next user gets fresh data from MongoDB
    await redisClient.flushDb(); 
    console.log('Redis Cache Cleared 🧹');
  } catch (err) {
    console.error('Failed to clear cache:', err);
  }
};