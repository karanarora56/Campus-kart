import Chat from '../src/models/Chat.js';

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🌙 Student Connected: ${socket.id}`);

    // Join a specific chat room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`📂 Student joined room: ${chatId}`);
    });

    // Handle real-time messaging with Persistence & Feedback
    socket.on('send_message', async (data, callback) => {
      const { chatId, senderId, text } = data;

      try {
        const newMessage = {
          sender: senderId,
          text: text,
          timestamp: new Date()
        };

        // 1. Persist to MongoDB FIRST (Ensures the "Source of Truth" is updated)
        const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          { $push: { messages: newMessage } },
          { new: true }
        );

        if (!updatedChat) {
          throw new Error("Chat session not found");
        }

        // 2. Emit to the room ONLY after successful DB save
        // We send the last message from the updatedChat to ensure ID & timestamps are synced
        const persistedMessage = updatedChat.messages[updatedChat.messages.length - 1];
        io.to(chatId).emit('receive_message', persistedMessage);

        // 3. Optional: Trigger a success callback to the sender
        if (callback) callback({ status: 'sent' });

      } catch (error) {
        console.error("❌ Socket Error:", error.message);
        // Notify the sender that the message failed
        socket.emit('error_message', { message: "Message could not be delivered." });
      }
    });

    // Handle Meetup Status Updates (Real-time safety)
    socket.on('update_meetup_status', async (data) => {
      const { chatId, status } = data;
      try {
        await Chat.findByIdAndUpdate(chatId, { status });
        io.to(chatId).emit('status_changed', { status });
      } catch (error) {
        console.error("❌ Meetup Update Error:", error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Student disconnected');
    });
  });
};

export default setupSocketHandlers;