import Product from '../models/Product.js';
import User from '../models/User.js';
import cloudinary from '../utils/cloudinary.js';
import { redisClient, clearProductCache } from '../config/redis.js'; // <--- IMPORT REDIS HELPERS

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campus-kart-products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

export const createProduct = async (req, res) => {
  try {
    const { title, description, category, price, isFree, preferredMeetupSpot, condition, postType, isRecovered } = req.body;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
      imageUrls = await Promise.all(uploadPromises);
    }

    const isItemFree = isFree === 'true';

    const product = await Product.create({
      seller: req.user._id,
      title, description, category,
      price: isItemFree ? 0 : Number(price),
      isFree: isItemFree, 
      images: imageUrls, 
      preferredMeetupSpot, condition,
      postType: postType || 'Listing',
      isRecovered: isRecovered === 'true'
    });

    // WIPE CACHE: So the new item shows up for everyone!
    await clearProductCache();

    res.status(201).json({ success: true, message: "Item posted successfully!", product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFoundFeed = async (req, res) => {
  try {
    const foundItems = await Product.find({ 
      postType: { $in: ['Lost', 'Found'] },
      isRecovered: false,
      isHidden: false,
      status: { $ne: 'Sold' } 
    }).populate('seller', 'fullName branch');

    res.status(200).json({ success: true, products: foundItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ENTERPRISE REDIS CACHE ---
// --- ENTERPRISE REDIS CACHE ---
export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const cacheKey = `products:${category || 'All'}:${search || 'none'}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log('⚡ Served from Redis Cache');
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log('🐌 Served from MongoDB');
    let query = { 
      postType: 'Listing',
      isHidden: false, 
      isAdminRemoved: false,
      status: 'Available' 
    };

    if (category && category !== 'All') query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    // FIX: Match only sellers who are NOT banned
    const products = await Product.find(query)
      .populate({
        path: 'seller', 
        select: 'fullName sustainabilityScore impactLevel isBanned',
        match: { isBanned: { $ne: true } } // <--- SECURITY: Ignore banned sellers
      }) 
      .sort({ createdAt: -1 });

    // FIX: Filter out any products where the seller returned as 'null' (because they were banned)
    const validProducts = products.filter(p => p.seller !== null);

    const responsePayload = { success: true, count: validProducts.length, products: validProducts };

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responsePayload));

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

export const markProductAsSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You can only mark your own items as sold!" });
    if (product.status === 'Sold') return res.status(400).json({ success: false, message: "This item is already marked as sold/resolved" });

    const updateData = { status: 'Sold' };
    if (product.postType === 'Lost' || product.postType === 'Found') updateData.isRecovered = true;

    await Product.findByIdAndUpdate(req.params.id, updateData);

    let pointsEarned = 10;
    if (product.isFree) pointsEarned += 20; 
    if (product.condition === 'Heavily Used') pointsEarned += 15;

    const updatedUser = await User.findByIdAndUpdate(
      product.seller, 
      { $inc: { sustainabilityScore: pointsEarned } },
      { new: true }
    );

    if (updatedUser.sustainabilityScore > 1000) updatedUser.impactLevel = 'Forest Guardian';
    else if (updatedUser.sustainabilityScore > 500) updatedUser.impactLevel = 'Tree';
    else if (updatedUser.sustainabilityScore > 100) updatedUser.impactLevel = 'Sprout';
    
    await updatedUser.save();

    // WIPE CACHE: So the "Sold" item instantly updates on the feed!
    await clearProductCache();

    res.status(200).json({ 
      success: true, 
      message: `Transaction complete! You earned ${pointsEarned} points.`,
      data: { newScore: updatedUser.sustainabilityScore, currentLevel: updatedUser.impactLevel }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reportProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    const validReasons = ['Prohibited Item', 'Scam/Fraud', 'Wrong Category', 'Harassment', 'Other', 'Inappropriate Content'];
    
    if (!validReasons.includes(reason)) return res.status(400).json({ success: false, message: "Invalid report reason" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const alreadyReported = product.reports.find(r => r.reporter.toString() === req.user._id.toString());
    if (alreadyReported) return res.status(400).json({ success: false, message: "You have already reported this item." });

    product.reports.push({ reporter: req.user._id, reason });
    await product.save();

    res.status(200).json({ success: true, message: "Report submitted. Our campus admins will review this shortly." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "You can only delete your own items!" });

    await product.deleteOne();

    // WIPE CACHE: So the deleted item is instantly removed from the feed!
    await clearProductCache();
    
    res.status(200).json({ success: true, message: "Item permanently deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSaveProduct = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    const isSaved = user.savedItems.some(id => id.toString() === productId);
    
    if (isSaved) {
      user.savedItems = user.savedItems.filter(id => id.toString() !== productId);
    } else {
      user.savedItems.push(productId);
    }
    
    await user.save();
    res.status(200).json({ success: true, savedItems: user.savedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSavedProducts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedItems',
      match: { isHidden: false, isAdminRemoved: false }, 
      populate: { path: 'seller', select: 'fullName branch' }
    });

    const validSavedItems = user.savedItems.filter(item => item !== null);
    res.status(200).json({ success: true, products: validSavedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};