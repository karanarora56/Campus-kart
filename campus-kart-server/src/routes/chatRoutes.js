import express from 'express';
const router = express.Router();
import { 
  accessChat, 
  getMyChats, 
  generateMeetupOTP, // Added
  verifyMeetupOTP    // Added
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

// 1. Create or fetch a 1-on-1 chat for a product
router.post('/', protect, accessChat);

// 2. Get the list of all chats the user is involved in (Inbox)
router.get('/', protect, getMyChats);

// 3. SECURE MEETUP HANDSHAKE ROUTES
router.post('/:id/generate-otp', protect, generateMeetupOTP);
router.post('/:id/verify-otp', protect, verifyMeetupOTP);

export default router;