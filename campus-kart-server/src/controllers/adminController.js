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