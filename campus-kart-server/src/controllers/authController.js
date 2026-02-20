import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendOTPEmail, sendAdminAlert } from '../utils/emailService.js';

/**
 * @desc Generate JWT and send via Cookie
 */
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Protects against CSRF attacks
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token, // Sending token in response too for easier frontend handling
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      branch: user.branch,
      batch: user.batch,
      sustainabilityScore: user.sustainabilityScore,
      impactLevel: user.impactLevel,
      isEmailVerified: user.isEmailVerified
    }
  });
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, branch, batch } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    user = await User.create({
      fullName,
      email,
      password,
      branch,
      batch,
      otp: otpCode,
      otpExpires: otpExpiry,
      isEmailVerified: false 
    });

    // Alert the student and the admin
   try {
  await sendOTPEmail(email, otpCode);
  await sendAdminAlert({ fullName, email, branch, batch });
} catch (mailError) {
  console.error("Email sending error:", mailError);
}

    res.status(201).json({ 
      success: true, 
      message: "Registration successful. Please check your NITJ email for the OTP." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Account is banned. Contact Admin." });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ success: false, message: "Please verify your NITJ email before logging in." });
    }

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body; 
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.otp = undefined; 
    user.otpExpires = undefined;
    await user.save();

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get Current Logged-in User Profile
 * @route GET /api/auth/profile
 * @access Private
 */
export const getProfile = async (req, res) => {
  try {
    // req.user is already populated by the 'protect' middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        branch: user.branch,
        batch: user.batch,
        sustainabilityScore: user.sustainabilityScore,
        impactLevel: user.impactLevel,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        isBanned: user.isBanned // Added to align with our Ban-check logic
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: "Email already verified" });

    // Generate new OTP [cite: 2026-02-16]
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 more minutes
    await user.save();

    // Send via your dual-email strategy [cite: 2026-02-16]
    // await sendOTPEmail(user.email, newOtp); 

    res.status(200).json({ success: true, message: "New OTP sent to your NITJ email." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * @desc    Request Password Reset OTP
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that NITJ email." });
    }

    // Generate a temporary Reset OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = resetOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 Min expiry
    await user.save();

    // Send the email
    try {
      await sendOTPEmail(email, resetOtp); 
    } catch (err) {
      console.error("Mail Error:", err);
    }

    res.status(200).json({ success: true, message: "Reset OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reset Password using OTP
 * @route   POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // Update password (pre-save hook will hash this automatically)
    user.password = newPassword;
    user.otp = undefined; // Clear OTP fields
    user.otpExpires = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful. You can now login." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};