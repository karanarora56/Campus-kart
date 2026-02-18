import express from 'express';
const router = express.Router();
import { accessChat, getMyChats } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

// 1. Create or fetch a 1-on-1 chat for a product
// POST /api/chat
router.post('/', protect, accessChat);

// 2. Get the list of all chats the user is involved in (Inbox)
// GET /api/chat
router.get('/', protect, getMyChats);

export default router;