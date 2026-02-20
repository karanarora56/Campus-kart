import express from 'express';
const router = express.Router();
// ADD THE NEW IMPORTS HERE:
import { 
  banUser, 
  unbanUser, 
  getUserModerationHistory, 
  getReportedProducts, 
  removeProductByAdmin,
  promoteToAdmin
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

// All routes below this line will require the user to be Logged In AND an Admin [cite: 2026-02-15]
router.use(protect);
router.use(isAdmin);

router.post('/ban', banUser);
router.post('/unban', unbanUser);
router.get('/history/:id', getUserModerationHistory);
router.get('/reports', getReportedProducts); // To view the list of reported items [cite: 2026-02-15]
router.delete('/product/:id', removeProductByAdmin); // To take action on a specific item [cite: 2026-02-15]
router.patch('/promote/:id', promoteToAdmin); // To promote a student to Admin role [cite: 2026-02-15]
export default router;