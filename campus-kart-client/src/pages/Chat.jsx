import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
// FIX: Added MapPin to the imports!
import { Send, Loader2, MessageSquare, ArrowLeft, ShieldCheck, AlertCircle, Key, Lock, Unlock, MapPin } from 'lucide-react';
import io from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { useStore } from '../store/useStore';

const ENDPOINT = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
let socket;

export const Chat = () => {
  const location = useLocation();
  const currentUser = useStore((state) => state.user); 
  const setUser = useStore((state) => state.setUser);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  
  const [otpInput, setOtpInput] = useState('');
  const [isProcessingOTP, setIsProcessingOTP] = useState(false);

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
    setOtpInput(''); 
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

  const handleGenerateOTP = async () => {
    try {
      setIsProcessingOTP(true);
      const { data } = await axiosInstance.post(`/chat/${activeChat._id}/generate-otp`);
      setActiveChat(prev => ({ ...prev, meetupOTP: data.otp }));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate PIN");
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 4) return alert("PIN must be exactly 4 digits");
    try {
      setIsProcessingOTP(true);
      const { data } = await axiosInstance.post(`/chat/${activeChat._id}/verify-otp`, { otp: otpInput });
      
      setActiveChat(prev => ({
        ...prev,
        product: { ...prev.product, status: 'Sold' },
        meetupOTP: undefined
      }));
      
      if (data.data) {
        setUser({
          ...currentUser,
          sustainabilityScore: data.data.newScore,
          impactLevel: data.data.currentLevel
        });
      }
      
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid PIN. Try again.");
    } finally {
      setIsProcessingOTP(false);
      setOtpInput('');
    }
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
                    src={chat.product?.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=150&q=80'} 
                    alt="product" 
                    className="h-12 w-12 rounded-xl object-cover opacity-80"
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="truncate font-bold text-slate-900 dark:text-white">{otherUser?.fullName || 'Campus Student'}</h4>
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
                src={activeChat.product?.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=150&q=80'} 
                alt="product" 
                className="h-10 w-10 rounded-lg object-cover opacity-80"
              />
              
             {/* FIX: Removed the duplicate title/price block here */}
             <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {activeChat.product?.title || 'Deleted Listing'}
                </h3>
                <p className={`text-xs font-bold tracking-wider uppercase ${activeChat.product?.postType === 'Lost' ? 'text-rose-500' : 'text-electric-violet'}`}>
                  {activeChat.product?.postType === 'Listing' 
                    ? (activeChat.product?.isFree || activeChat.product?.price === 0 ? 'FREE' : (activeChat.product?.price ? `₹${activeChat.product.price}` : ''))
                    : activeChat.product?.postType ? `${activeChat.product.postType} ITEM` : ''}
                </p>
              </div>

              {/* Blue Location Badge */}
              <div className="hidden flex-col items-end gap-1 sm:flex">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={14} /> Safe Meetup
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <MapPin size={14} /> Meet at: {activeChat.meetupLocation || 'Snackers'}
                </div>
              </div>
            </div>

            {/* LIVE MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {!activeChat.product && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  This item is no longer available in the marketplace.
                </div>
              )}

              {activeChat.product && activeChat.product.status === 'Sold' && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={16} />
                  {activeChat.product.postType === 'Listing' ? 'This item has been sold.' : 'This issue has been resolved.'}
                </div>
              )}
              
              {/* --- SAFE MEETUP LOCKBOX --- */}
              {activeChat.product && activeChat.product.status !== 'Sold' && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-electric-violet/20 bg-gradient-to-r from-electric-violet/5 to-blue-500/5 p-5 shadow-sm dark:border-electric-violet/30">
                  <div className="mb-3 flex items-center gap-2">
                    <Lock size={18} className="text-electric-violet" />
                    <h4 className="font-extrabold text-slate-900 dark:text-white">Safe Meetup Handshake</h4>
                  </div>
                  
                  {(() => {
                    const myId = String(currentUser?._id || currentUser?.id);
                    const isSeller = String(activeChat.product.seller) === myId || String(activeChat.product.seller?._id) === myId;
                    
                    return isSeller ? (
                      // SELLER VIEW
                      <div>
                        <p className="mb-3 text-sm text-slate-600 dark:text-gray-300">
                          When you meet the buyer, ask them for their 4-digit PIN to securely complete the transaction and earn Karma points.
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              maxLength="4" 
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter 4-Digit PIN" 
                              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 font-bold tracking-widest text-slate-900 focus:border-electric-violet focus:outline-none focus:ring-2 focus:ring-electric-violet/50 dark:border-white/10 dark:bg-black/50 dark:text-white"
                            />
                          </div>
                          <button 
                            onClick={handleVerifyOTP}
                            disabled={isProcessingOTP || otpInput.length !== 4}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-electric-violet px-6 font-bold text-white transition-all hover:bg-[#6D28D9] disabled:opacity-50"
                          >
                            {isProcessingOTP ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
                            Verify
                          </button>
                        </div>
                      </div>
                    ) : (
                      // BUYER VIEW
                      <div>
                        <p className="mb-4 text-sm text-slate-600 dark:text-gray-300">
                          Generate a secure PIN. When you meet the seller in person, show them this PIN to claim your item!
                        </p>
                        {activeChat.meetupOTP ? (
                          <div className="flex items-center justify-between rounded-xl border border-dashed border-electric-violet bg-white p-4 dark:bg-black/50">
                            <span className="text-sm font-semibold text-slate-500">Your Secure PIN:</span>
                            <span className="text-2xl font-black tracking-[0.25em] text-electric-violet">{activeChat.meetupOTP}</span>
                          </div>
                        ) : (
                          <button 
                            onClick={handleGenerateOTP}
                            disabled={isProcessingOTP}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200 disabled:opacity-50"
                          >
                            {isProcessingOTP ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                            Generate Meetup PIN
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* --- END LOCKBOX --- */}

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
                  disabled={!activeChat.product || activeChat.product.status === 'Sold'}
                  className="flex-1 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet disabled:opacity-50 dark:border-white/20 dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={!messageInput.trim() || !activeChat.product || activeChat.product.status === 'Sold'}
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