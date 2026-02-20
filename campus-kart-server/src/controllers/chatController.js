import Chat from '../models/Chat.js';

export const accessChat = async (req, res) => {
  const { productId, sellerId } = req.body;
  const buyerId = req.user._id; // Use ._id to be safe

  // Also, when comparing MongoDB ObjectIDs, use .toString()
  if (buyerId.toString() === sellerId.toString()) {
    return res.status(400).json({ message: "You cannot start a chat with yourself." });
  }

  try {
    // FIX 2: Sort IDs so the unique index always matches regardless of who starts the chat
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
      messages: []
    });

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// getMyChats remains the same as yours - it's good!

// 2. Get all chats for the logged-in user (Inbox)
export const getMyChats = async (req, res) => {
  try {
    // Using req.user._id ensures we match the database participant IDs exactly
    const chats = await Chat.find({ participants: req.user._id }) 
      .populate('participants', 'fullName email')
      .populate('product', 'title price images')
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};