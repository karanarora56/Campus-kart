import Chat from '../models/Chat.js';

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🌙 Student Connected: ${socket.id}`);

    // Join a specific chat room (e.g., Buyer + Seller for a Cycle)
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`📂 Student joined room: ${chatId}`);
    });

    // Handle real-time messaging
    socket.on('send_message', async (data) => {
      const { chatId, senderId, text } = data;

      try {
        const newMessage = {
          sender: senderId,
          text: text,
          timestamp: new Date()
        };

        // 1. Emit to the room instantly (so it feels fast)
        io.to(chatId).emit('receive_message', newMessage);

        // 2. Persist to MongoDB using your updated Chat model
        await Chat.findByIdAndUpdate(chatId, {
          $push: { messages: newMessage }
        });

      } catch (error) {
        console.error("❌ Socket Error:", error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Student disconnected');
    });
  });
};

export default setupSocketHandlers;