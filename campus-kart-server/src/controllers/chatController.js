import Chat from '../models/Chat.js';

export const accessChat = async (req, res) => {
  const { productId, sellerId } = req.body;
  const buyerId = req.user.id;

  // FIX 1: Prevent self-chatting
  if (buyerId === sellerId) {
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
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'fullName email')
      .populate('product', 'title price images')
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};