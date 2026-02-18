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
    await Promise.all([
      sendOTPEmail(email, otpCode),
      sendAdminAlert({ fullName, email, branch, batch }) 
    ]);

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