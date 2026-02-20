import User from '../models/User.js';
import Product from '../models/Product.js';

/**
 * @desc    Ban a student, log it, and hide all their listings
 * @route   POST /api/admin/ban
 * @access  Private/Admin
 */
export const banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user._id; 

    // --- SELF-BAN PROTECTION ---
    if (userId.toString() === adminId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: "High-End Security Error: You cannot ban your own Admin account." 
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isBanned) return res.status(400).json({ success: false, message: "User is already banned" });

    // 1. Log to Moderation History & Flip Flag
    user.isBanned = true;
    user.moderationHistory.push({
      action: 'BAN',
      reason: reason || "Violation of campus guidelines",
      performedBy: adminId
    });

    await user.save();
    
    // 2. Automated Cleanup: Hide all items from this user
    await Product.updateMany({ seller: userId }, { isHidden: true });

    res.status(200).json({ 
      success: true, 
      message: `User ${user.fullName} banned. Listings hidden.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Unban a student, log it, and restore listings
 * @route   POST /api/admin/unban
 * @access  Private/Admin
 */
export const unbanUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 1. Restore Access & Log it
    user.isBanned = false;
    user.moderationHistory.push({
      action: 'UNBAN',
      reason: reason || "Account restored after review",
      performedBy: adminId
    });

    await user.save();

    // 2. Restoration: Bring their items back to the marketplace
    await Product.updateMany({ seller: userId }, { isHidden: false });

    res.status(200).json({ success: true, message: `User ${user.fullName} restored.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    View full moderation audit trail
 * @route   GET /api/admin/user-history/:id
 */
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
/**
 * @desc    View all reported items for moderation
 * @route   GET /api/admin/reports
 */
/**
 * @desc    View all reported items for moderation
 * @route   GET /api/admin/reports
 */
export const getReportedProducts = async (req, res) => {
  try {
    // 1. Fetch products where the reports array is not empty
    const reportedItems = await Product.find({ "reports.0": { $exists: true } })
      .populate('seller', 'fullName email branch')
      .populate('reports.reporter', 'fullName email'); // CHANGED FROM reportedBy TO reporter

    res.status(200).json({ 
      success: true, 
      count: reportedItems.length, 
      data: reportedItems 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Admin removal of a specific product
 * @route   DELETE /api/admin/product/:id
 */
export const removeProductByAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Permanent removal or soft hide? Soft hide is safer for audit trails.
    product.isAdminRemoved = true;
    product.isHidden = true;
    await product.save();

    res.status(200).json({ success: true, message: "Item removed by Admin for violation." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Promote a student to Admin role
 * @route   PATCH /api/admin/promote/:id
 * @access  Private/Admin
 */
export const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: "User is already an Admin" });
    }

    // Update role
    user.role = 'admin';
    
    // Log this promotion in their history for the audit trail
    user.moderationHistory.push({
      action: 'PROMOTION',
      reason: "Promoted to Admin status by " + req.user.fullName,
      performedBy: req.user._id
    });

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `${user.fullName} has been promoted to Admin.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};