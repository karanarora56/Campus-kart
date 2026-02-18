import Product from '../models/Product.js';
import User from '../models/User.js';

/**
 * @desc    Create a new product listing or Lost/Found post
 * @route   POST /api/products
 * @access  Private (Verified Students)
 */
export const createProduct = async (req, res) => {
  try {
    const { 
      title, description, category, price, isFree, 
      images, preferredMeetupSpot, condition,
      postType, isRecovered 
    } = req.body;

    const product = await Product.create({
      seller: req.user._id,
      title, description, category,
      price: isFree ? 0 : price,
      isFree, images, preferredMeetupSpot, condition,
      postType: postType || 'Listing',
      isRecovered: isRecovered || false
    });

    res.status(201).json({ success: true, message: "Item posted!", product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Fetch items specifically for the Lost & Found section
 * @route   GET /api/products/found-feed
 * @access  Public
 */
export const getFoundFeed = async (req, res) => {
  try {
    const foundItems = await Product.find({ 
      postType: { $in: ['Lost', 'Found'] },
      isRecovered: false,
      isHidden: false 
    }).populate('seller', 'fullName branch');

    res.status(200).json({ success: true, products: foundItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Fetch all available marketplace listings (Excludes Lost/Found)
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      postType: 'Listing',
      isHidden: false, 
      isAdminRemoved: false,
      status: 'Available' 
    })
    .populate('seller', 'fullName sustainabilityScore impactLevel') 
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get detailed view of a single product
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'fullName email sustainabilityScore');
      
    if (!product || product.isHidden) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Mark item as sold and calculate Sustainability Score for seller
 * @route   PATCH /api/products/:id/sold
 * @access  Private (Owner only)
 */
export const markProductAsSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // 1. Check existence FIRST
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Check Ownership SECOND (Security Layer)
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only mark your own items as sold!" });
    }

    // 3. Check Status THIRD
    if (product.status === 'Sold') {
      return res.status(400).json({ success: false, message: "This item is already marked as sold" });
    }

    product.status = 'Sold';
    await product.save();

    // --- SUSTAINABILITY CALCULATOR ---
    let pointsEarned = 10; // Base points for reusing
    if (product.isFree) pointsEarned += 20; 
    if (product.condition === 'Heavily Used') pointsEarned += 15;

    const updatedUser = await User.findByIdAndUpdate(
      product.seller, 
      { $inc: { sustainabilityScore: pointsEarned } },
      { new: true }
    );

    // Dynamic Impact Leveling Logic
    if (updatedUser.sustainabilityScore > 1000) {
      updatedUser.impactLevel = 'Forest Guardian';
    } else if (updatedUser.sustainabilityScore > 500) {
      updatedUser.impactLevel = 'Tree';
    } else if (updatedUser.sustainabilityScore > 100) {
      updatedUser.impactLevel = 'Sprout';
    }
    
    await updatedUser.save();

    res.status(200).json({ 
      success: true, 
      message: `Transaction complete! You earned ${pointsEarned} points.`,
      data: {
        newScore: updatedUser.sustainabilityScore,
        currentLevel: updatedUser.impactLevel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    Report a product for moderation
 * @route   POST /api/products/:id/report
 * @access  Private (Verified Students)
 */
export const reportProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Validate reason
   const validReasons = ['Prohibited Item', 'Scam/Fraud', 'Wrong Category', 'Harassment', 'Other', 'Inappropriate Content'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: "Invalid report reason" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // High-end touch: Prevent duplicate reporting by the same user
    const alreadyReported = product.reports.find(
      (r) => r.reporter.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ success: false, message: "You have already reported this item." });
    }

    product.reports.push({
      reporter: req.user._id,
      reason
    });

    await product.save();

    res.status(200).json({ 
      success: true, 
      message: "Report submitted. Our campus admins will review this shortly." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};