import User from '../models/User.js';
import Product from '../models/Product.js';

export const banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user._id; 

    if (userId.toString() === adminId.toString()) {
      return res.status(400).json({ success: false, message: "Security Error: You cannot ban yourself." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isBanned) return res.status(400).json({ success: false, message: "User is already banned" });

    user.isBanned = true;
    user.moderationHistory.push({
      action: 'BAN',
      reason: reason || "Violation of campus guidelines",
      performedBy: adminId,
      createdAt: new Date() // <--- ADD THIS LINE
    });

    await user.save();
    await Product.updateMany({ seller: userId }, { isHidden: true });

    res.status(200).json({ success: true, message: `User ${user.fullName} banned.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isBanned = false;
    user.moderationHistory.push({
      action: 'UNBAN',
      reason: reason || "Account restored after review",
      performedBy: adminId,
      createdAt: new Date() // <--- ADD THIS LINE
    });

    await user.save();
    await Product.updateMany({ seller: userId }, { isHidden: false });

    res.status(200).json({ success: true, message: `User ${user.fullName} restored.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserModerationHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('fullName email moderationHistory isBanned')
      .populate('moderationHistory.performedBy', 'fullName email');

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReportedProducts = async (req, res) => {
  try {
    const reportedItems = await Product.find({ "reports.0": { $exists: true } })
      .populate('seller', 'fullName email branch isBanned')
      .populate('reports.reporter', 'fullName email');

    res.status(200).json({ success: true, count: reportedItems.length, data: reportedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeProductByAdmin = async (req, res) => {
  try {
    // FIX: Use findByIdAndUpdate to bypass validation of old schema fields
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { isAdminRemoved: true, isHidden: true },
      { new: true }
    );
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Item removed by Admin." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: "User is already an Admin" });

    user.role = 'admin';
   user.moderationHistory.push({
      action: 'PROMOTION',
      reason: "Promoted to Admin status by " + req.user.fullName,
      performedBy: req.user._id,
      createdAt: new Date() // <--- ADD THIS LINE
    });

    await user.save();
    res.status(200).json({ success: true, message: `${user.fullName} is now an Admin.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearReports = async (req, res) => {
  try {
    // FIX: Use findByIdAndUpdate to bypass validation
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { reports: [] },
      { new: true }
    );
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Reports cleared." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Fetch all users for the Admin panel
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};