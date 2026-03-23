import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
      <div className={`w-full flex-col border-r border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-[#0B0E14]/50 md:flex md:w-[35%] lg:w-1/3 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0B0E14]">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-gray-400">
              <MessageSquare className="mb-3 opacity-50" size={32} />
              <p className="text-sm font-medium">No messages yet.</p>
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
                    isSelected ? 'bg-white shadow-sm dark:bg-white/5' : 'hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={chat.product?.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=150&q=80'} 
                      alt="product" 
                      className="h-12 w-12 rounded-xl object-cover shadow-sm"
                    />
                    {isSelected && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-electric-violet dark:border-[#0B0E14]"></div>}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`truncate text-sm font-bold ${isSelected ? 'text-electric-violet' : 'text-slate-900 dark:text-white'}`}>
                      {otherUser?.fullName || 'Campus Student'}
                    </h4>
                    <p className={`truncate text-xs mt-0.5 ${!chat.product ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-gray-400'}`}>
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
      <div className={`flex-1 flex-col bg-[#F8FAFC] dark:bg-[#12161f] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-600">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0B0E14] shadow-sm z-10">
              <button className="md:hidden text-slate-500 transition-colors hover:text-electric-violet" onClick={() => setActiveChat(null)}>
                <ArrowLeft size={24} />
              </button>
              <img 
                src={activeChat.product?.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=150&q=80'} 
                alt="product" 
                className="h-10 w-10 rounded-lg object-cover shadow-sm"
              />
              
             <div className="flex-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                  {activeChat.product?.title || 'Deleted Listing'}
                </h3>
                <p className={`text-[11px] font-black tracking-wider uppercase mt-0.5 ${activeChat.product?.postType === 'Lost' ? 'text-rose-500' : 'text-electric-violet'}`}>
                  {activeChat.product?.postType === 'Listing' 
                    ? (activeChat.product?.isFree || activeChat.product?.price === 0 ? 'FREE' : (activeChat.product?.price ? `₹${activeChat.product.price}` : ''))
                    : activeChat.product?.postType ? `${activeChat.product.postType} ITEM` : ''}
                </p>
              </div>

              {/* Blue Location Badge */}
              <div className="hidden flex-col items-end gap-1.5 sm:flex">
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck size={14} /> Safe Meetup
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <MapPin size={14} /> {activeChat.meetupLocation || 'Snackers'}
                </div>
              </div>
            </div>

            {/* LIVE MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {!activeChat.product && (
                <div className="mx-auto max-w-md mb-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                  <AlertCircle size={16} />
                  This item is no longer available.
                </div>
              )}

              {activeChat.product && activeChat.product.status === 'Sold' && (
                <div className="mx-auto max-w-md mb-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                  <ShieldCheck size={16} />
                  {activeChat.product.postType === 'Listing' ? 'This item has been sold.' : 'This issue has been resolved.'}
                </div>
              )}
              
              {/* --- SLEEK COMPACT LOCKBOX --- */}
              {activeChat.product && activeChat.product.status !== 'Sold' && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-electric-violet/20 bg-gradient-to-r from-electric-violet/5 via-white to-blue-500/5 p-4 shadow-sm dark:from-electric-violet/10 dark:via-[#0B0E14] dark:to-blue-500/10 dark:border-electric-violet/30">
                  {(() => {
                    const myId = String(currentUser?._id || currentUser?.id);
                    const isSeller = String(activeChat.product.seller) === myId || String(activeChat.product.seller?._id) === myId;
                    
                    return isSeller ? (
                      // SELLER VIEW (Compact)
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Lock size={16} className="text-electric-violet" />
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Secure Handshake</h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            Ask the buyer for their 4-digit PIN to complete the sale.
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="relative w-32">
                            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              maxLength="4" 
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="PIN" 
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold tracking-widest text-slate-900 shadow-sm focus:border-electric-violet focus:outline-none focus:ring-2 focus:ring-electric-violet/20 dark:border-white/10 dark:bg-black/50 dark:text-white"
                            />
                          </div>
                          <button 
                            onClick={handleVerifyOTP}
                            disabled={isProcessingOTP || otpInput.length !== 4}
                            className="flex h-[38px] items-center justify-center gap-1.5 rounded-lg bg-electric-violet px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#6D28D9] disabled:opacity-50"
                          >
                            {isProcessingOTP ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                            Verify
                          </button>
                        </div>
                      </div>
                    ) : (
                      // BUYER VIEW (Compact)
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Lock size={16} className="text-electric-violet" />
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Secure Handshake</h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            Show this PIN to the seller when you meet in person.
                          </p>
                        </div>
                        <div className="shrink-0">
                          {activeChat.meetupOTP ? (
                            <div className="flex items-center justify-center rounded-lg border border-electric-violet/30 bg-white px-6 py-2 shadow-sm dark:bg-black/50">
                              <span className="text-lg font-black tracking-[0.25em] text-electric-violet">{activeChat.meetupOTP}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={handleGenerateOTP}
                              disabled={isProcessingOTP}
                              className="flex h-[38px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200 disabled:opacity-50"
                            >
                              {isProcessingOTP ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                              Generate PIN
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* --- END LOCKBOX --- */}

              {messages.length === 0 ? (
                <div className="mt-20 flex flex-col items-center justify-center text-center text-sm text-slate-400 dark:text-gray-500">
                  <div className="mb-4 rounded-full bg-electric-violet/10 p-4 text-electric-violet">
                    <MessageSquare size={24} />
                  </div>
                  <p>This is the beginning of your conversation.</p>
                  <p className="mt-1 font-medium">Say hi to arrange a meetup!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg, index) => {
                    const myId = String(currentUser?._id || currentUser?.id);
                    const rawSender = msg.sender;
                    const msgSenderId = String(typeof rawSender === 'object' ? (rawSender?._id || rawSender?.id) : rawSender);
                    const isSender = (msgSenderId === myId);
                    
                    return (
                      <div key={index} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                        {/* THE MODERN CHAT BUBBLE */}
                        <div className={`group relative max-w-[75%] px-4 py-2.5 text-[15px] shadow-sm ${
                          isSender 
                            ? 'bg-electric-violet text-white rounded-2xl rounded-br-sm' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-sm dark:bg-white/5 dark:text-white dark:border-white/5'
                        }`}>
                          <p className="leading-relaxed">{msg.text}</p>
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-medium ${isSender ? 'text-white/70' : 'text-slate-400 dark:text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              )}
            </div>

            {/* MESSAGE INPUT FORM */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0B0E14] z-10">
              <form onSubmit={sendMessage} className="mx-auto flex max-w-4xl items-center gap-3">
               <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={!activeChat.product || activeChat.product.status === 'Sold'}
                  className="flex-1 rounded-full border border-slate-200 bg-[#F8FAFC] px-5 py-3.5 text-[15px] text-slate-900 transition-all focus:border-electric-violet focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-violet/20 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#0B0E14]"
                />
                <button 
                  type="submit"
                  disabled={!messageInput.trim() || !activeChat.product || activeChat.product.status === 'Sold'}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-electric-violet text-white shadow-md transition-all hover:bg-[#6D28D9] hover:shadow-lg hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
};