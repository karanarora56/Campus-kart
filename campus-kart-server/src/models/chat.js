import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validate: [val => val.length === 2, 'A chat must have exactly 2 participants (Buyer & Seller)']
  },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],

  // Syncing with Product locations
  meetupLocation: { 
    type: String, 
    enum: [
      'BH-1', 'BH-2', 'BH-5', 'BH-6', 'BH-7', 'Mega Boys Block A', 'Mega Boys Block B', 'Mega Boys Block F', 
      'GH-1', 'GH-2', 'Mega Girls Hostel', 'Nescafe', 'Night Canteen', 'Snackers', 'Yadav Canteen', 
      'Campus Cafe', 'Rim Jhim Bakery', 'Central Library', 'Department Building'
    ],
    default: 'Snackers' 
  },
  
  // String type to handle leading zeros safely
  meetupOTP: { 
    type: String, 
    select: false 
  },

  status: { 
    type: String, 
    enum: ['Chatting', 'Meetup Arranged', 'Completed', 'Cancelled'], 
    default: 'Chatting' 
  }
}, { timestamps: true });

// Prevent duplicate chats for the same product between the same two students
chatSchema.index({ product: 1, participants: 1 }, { unique: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;