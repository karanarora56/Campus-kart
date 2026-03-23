import Chat from '../models/chat.js';
import Product from '../models/Product.js'; // Added
import User from '../models/User.js';       // Added
export const accessChat = async (req, res) => {
  // FIX: Destructure meetupLocation from req.body
  const { productId, sellerId, meetupLocation } = req.body; 
  const buyerId = req.user._id; 

  if (buyerId.toString() === sellerId.toString()) {
    return res.status(400).json({ message: "You cannot start a chat with yourself." });
  }

  try {
    const sortedParticipants = [buyerId, sellerId].sort();

    let chat = await Chat.findOne({
      product: productId,
      participants: sortedParticipants
    });

    if (chat) {
      return res.status(200).json(chat);
    }

    const newChat = await Chat.create({
      product: productId,
      participants: sortedParticipants,
      // FIX: Save the location, default to Snackers if none provided
      meetupLocation: meetupLocation || 'Snackers', 
      messages: []
    });

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyChats = async (req, res) => {
  try {
    let chats = await Chat.find({ participants: req.user._id }) 
      .populate('participants', 'fullName email')
      .populate({
        path: 'product',
        // FIX: Added 'seller' so the frontend knows who the owner is
        select: 'title price images postType isFree status isRecovered seller', 
        match: { isHidden: false, isAdminRemoved: false } 
      }) 
      .select('+meetupOTP') // Pull the OTP from the DB
      .sort({ updatedAt: -1 });

    // HIGH-END SECURITY: 
    // Strip the OTP out of the response if the person requesting it is the SELLER.
    // This forces them to actually get the PIN from the buyer in person!
    chats = chats.map(chat => {
      const chatObj = chat.toObject();
      if (chatObj.product && chatObj.product.seller.toString() === req.user._id.toString()) {
         delete chatObj.meetupOTP;
      }
      return chatObj;
    });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- PHASE 11: SAFE MEETUP HANDSHAKE ---

export const generateMeetupOTP = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate('product');
    if (!chat || !chat.product) return res.status(404).json({ success: false, message: 'Chat or Product not found' });

    // Security: Only the BUYER can generate the OTP
    if (chat.product.seller.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Sellers cannot generate the PIN.' });
    }

    // Generate a random 4-digit PIN
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); 
    
    chat.meetupOTP = otp;
    await chat.save();

    res.status(200).json({ success: true, otp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyMeetupOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    // We must select +meetupOTP here because it's hidden by default in the schema
    const chat = await Chat.findById(req.params.id).select('+meetupOTP').populate('product');

    if (!chat || !chat.product) return res.status(404).json({ success: false, message: 'Chat or Product not found' });

    // Security: Only the SELLER can verify the OTP
    if (chat.product.seller.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, message: 'Only the seller can verify the PIN.' });
    }

    if (!chat.meetupOTP || chat.meetupOTP !== otp) {
       return res.status(400).json({ success: false, message: 'Invalid or expired PIN.' });
    }

    // 1. PIN IS CORRECT! Mark item as sold.
    const product = await Product.findById(chat.product._id);
    product.status = 'Sold';
    if (product.postType === 'Lost' || product.postType === 'Found') {
      product.isRecovered = true;
    }
    await product.save();

    // 2. Automate Sustainability Karma!
    let pointsEarned = 10;
    if (product.isFree) pointsEarned += 20;
    if (product.condition === 'Heavily Used') pointsEarned += 15;

    const updatedUser = await User.findByIdAndUpdate(
      product.seller,
      { $inc: { sustainabilityScore: pointsEarned } },
      { new: true }
    );

    // Update Impact Level
    if (updatedUser.sustainabilityScore > 1000) updatedUser.impactLevel = 'Forest Guardian';
    else if (updatedUser.sustainabilityScore > 500) updatedUser.impactLevel = 'Tree';
    else if (updatedUser.sustainabilityScore > 100) updatedUser.impactLevel = 'Sprout';
    await updatedUser.save();

    // 3. Clear the OTP to prevent reuse
  chat.meetupOTP = undefined;
    await chat.save();

    // FIX: Send the new score and level back to the frontend!
    res.status(200).json({ 
      success: true, 
      message: 'Handshake successful! Item sold and Karma Points awarded.',
      data: {
        newScore: updatedUser.sustainabilityScore,
        currentLevel: updatedUser.impactLevel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};