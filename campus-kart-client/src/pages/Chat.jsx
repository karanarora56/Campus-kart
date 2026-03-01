import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, MessageSquare, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { useStore } from '../store/useStore';

const ENDPOINT = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
let socket;

export const Chat = () => {
  const location = useLocation();
  const currentUser = useStore((state) => state.user); 

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io(ENDPOINT);
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await axiosInstance.get('/chat');
        setChats(data);

        if (location.state?.activeChatId) {
          const targetChat = data.find(c => c._id === location.state.activeChatId);
          if (targetChat) {
            setActiveChat(targetChat);
            if (location.state.initialMessage) {
              setMessageInput(location.state.initialMessage);
            }
          }
        } else if (data.length > 0) {
          setActiveChat(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [location.state]);

  useEffect(() => {
    if (!activeChat || !socket) return;

    setMessages(activeChat.messages || []);
    socket.emit('join_chat', activeChat._id);

    socket.on('receive_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    const myId = String(currentUser?._id || currentUser?.id);

    if (!messageInput.trim() || !activeChat || !myId) return;

    const messageData = {
      chatId: activeChat._id,
      senderId: myId, 
      text: messageInput
    };

    socket.emit('send_message', messageData, (response) => {
      if (response && response.status === 'sent') {
        console.log('Message delivered securely.');
      }
    });

    setMessageInput(''); 
  };

  const getOtherParticipant = (participants) => {
    if (!currentUser || !participants) return null;
    const myId = String(currentUser._id || currentUser.id);
    return participants.find(p => String(p._id || p.id) !== myId) || participants[0];
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-electric-violet" size={40} /></div>;
  }

  return (
    <div className="mx-auto flex h-[85vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0B0E14]">
      
      {/* --- LEFT SIDEBAR: INBOX LIST --- */}
      <div className={`w-full flex-col border-r border-slate-200 dark:border-white/10 md:flex md:w-1/3 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-gray-400">
              <MessageSquare className="mx-auto mb-3 opacity-50" size={32} />
              <p>No messages yet.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat.participants);
              const isSelected = activeChat?._id === chat._id;
              
              return (
                <button
                  key={chat._id}
                  onClick={() => setActiveChat(chat)}
                  className={`flex w-full items-center gap-4 border-b border-slate-100 p-4 text-left transition-all dark:border-white/5 ${
                    isSelected ? 'bg-electric-violet/10 dark:bg-electric-violet/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <img 
                    // SAFE GUARD ADDED HERE
                    src={chat.product?.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=150&q=80'} 
                    alt="product" 
                    className="h-12 w-12 rounded-xl object-cover opacity-80"
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="truncate font-bold text-slate-900 dark:text-white">{otherUser?.fullName || 'Campus Student'}</h4>
                    {/* SAFE GUARD ADDED HERE */}
                    <p className={`truncate text-sm ${!chat.product ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-gray-400'}`}>
                      {chat.product?.title || '🚫 Listing Deleted'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* --- RIGHT PANE: ACTIVE CHAT WINDOW --- */}
      <div className={`flex-1 flex-col bg-slate-50 dark:bg-[#12161f] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0B0E14]">
              <button className="md:hidden text-slate-500" onClick={() => setActiveChat(null)}>
                <ArrowLeft size={24} />
              </button>
              <img 
                // SAFE GUARD ADDED HERE
                src={activeChat.product?.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=150&q=80'} 
                alt="product" 
                className="h-10 w-10 rounded-lg object-cover opacity-80"
              />
             <div className="flex-1">
                {/* SAFE GUARD ADDED HERE */}
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {activeChat.product?.title || 'Deleted Listing'}
                </h3>
                
                {/* ADD THIS P TAG BACK IN */}
                <p className={`text-xs font-bold tracking-wider uppercase ${activeChat.product?.postType === 'Lost' ? 'text-rose-500' : 'text-electric-violet'}`}>
                  {activeChat.product?.postType === 'Listing' 
                    ? (activeChat.product?.isFree || activeChat.product?.price === 0 ? 'FREE' : (activeChat.product?.price ? `₹${activeChat.product.price}` : ''))
                    : activeChat.product?.postType ? `${activeChat.product.postType} ITEM` : ''}
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:flex">
                <ShieldCheck size={16} />
                Safe Meetup
              </div>
            </div>

            {/* LIVE MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-5">
              {!activeChat.product && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  The seller has deleted this item from the marketplace.
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="mt-10 text-center text-sm text-slate-400 dark:text-gray-500">
                  This is the beginning of your conversation. 
                  <br/>Send a message to arrange a meetup!
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg, index) => {
                    const myId = String(currentUser?._id || currentUser?.id);
                    const rawSender = msg.sender;
                    const msgSenderId = String(typeof rawSender === 'object' ? (rawSender?._id || rawSender?.id) : rawSender);
                    const isSender = (msgSenderId === myId);
                    
                    return (
                      <div key={index} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                          isSender 
                            ? 'bg-electric-violet text-white rounded-br-none' 
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 dark:bg-white/5 dark:text-white dark:border-white/10'
                        }`}>
                          {msg.text}
                          <div className={`mt-1 text-[10px] text-right ${isSender ? 'text-white/70' : 'text-slate-400 dark:text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* MESSAGE INPUT FORM */}
            <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0B0E14]">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  // Prevent sending new messages if the product is deleted
                  disabled={!activeChat.product}
                  className="flex-1 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet disabled:opacity-50 dark:border-white/20 dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={!messageInput.trim() || !activeChat.product}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-violet text-white transition-all hover:bg-[#6D28D9] hover:shadow-lg disabled:opacity-50"
                >
                  <Send size={20} className="ml-1" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
};