import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Verify if the user is logged in & NOT banned
export const protect = async (req, res, next) => {
  let token = req.cookies.token; 

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // --- CRITICAL BAN CHECK ---
    if (user.isBanned) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account has been banned. Please contact campus.kart.hq@gmail.com" 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

// 2. Verify if the user is an Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied: Admins only" });
  }
};