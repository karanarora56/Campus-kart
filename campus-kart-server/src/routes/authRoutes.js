import express from 'express';
const router = express.Router();
import { 
  register, 
  login, 
  verifyOTP, 
  getProfile, 
  resendOTP, 
  forgotPassword, 
  resetPassword,
  logout

} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/profile', protect, getProfile);

// New Recovery & Verification Routes
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


router.post('/logout', logout);

export default router;