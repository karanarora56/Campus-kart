import express from 'express';
const router = express.Router();
import { banUser, unbanUser, getUserModerationHistory } from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

// All routes below this line will require the user to be Logged In AND an Admin
router.use(protect);
router.use(isAdmin);

router.post('/ban', banUser);
router.post('/unban', unbanUser);
router.get('/history/:id', getUserModerationHistory);

export default router;