import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * @desc    Generate JWT and send via Cookie
 */
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
    httpOnly: true, // Secure: No JS access
    secure: process.env.NODE_ENV === 'production',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      sustainabilityScore: user.sustainabilityScore,
      impactLevel: user.impactLevel
    }
  });
};
export const register = async (req, res) => {
  try {
    const { fullName, email, password, branch, batch } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: "User already exists" });

    // 1. Generate 6-digit OTP as a String
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 2. Create User with OTP (But isEmailVerified remains false)
    user = await User.create({
      fullName,
      email,
      password,
      branch,
      batch,
      otp: otpCode,
      otpExpires: otpExpiry
    });

    // 3. DO NOT CALL sendToken yet. 
    // Just tell the frontend to move to the OTP screen.
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

    // 1. Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    // 2. Find user & explicitly select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // 3. Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // 4. Check if Banned
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Account is banned. Contact Admin." });
    }

// 3.5 Check if Email is Verified
if (!user.isEmailVerified) {
  return res.status(401).json({ 
    success: false, 
    message: "Please verify your NITJ email before logging in." 
  });
}

sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Verify OTP sent to @nitj.ac.in email
 * @route   POST /api/auth/verify-otp
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body; 

    // 1. Find the student by email
    const user = await User.findOne({ email });

    // 2. CHECK: Does the OTP match? Is it still within the 10-minute window?
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // 3. SUCCESS: Flip the verification flag to TRUE
    user.isEmailVerified = true;
    
    // 4. CLEANUP: Remove the OTP from the database so it can't be used again
    user.otp = undefined; 
    user.otpExpires = undefined;
    await user.save();

    // 5. LOGIN: Now that they are verified, issue the secure Cookie
    sendToken(user, 200, res);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};