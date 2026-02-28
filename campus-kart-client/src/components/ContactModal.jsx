import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const QUICK_MESSAGES = [
  "Is this item still available?",
  "I'm interested! Can we discuss the price?",
  "Can I get more details about the condition?",
  "I'd like to offer something in exchange for this.",
  "Check out my profile for potential swap items!"
];

export const ContactModal = ({ isOpen, onClose, product }) => {
  const navigate = useNavigate();
  const [selectedMsg, setSelectedMsg] = useState(QUICK_MESSAGES[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(''); // 1. ADD ERROR STATE

  if (!product) return null;

  const handleSend = async () => {
    try {
      setLoading(true);
      setError(''); // Reset error on new attempt
      
      const { data: chat } = await axiosInstance.post('/chat', {
        productId: product._id || product.id,
        sellerId: product.seller._id || product.seller
      });

      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        navigate('/chat', { 
          state: { activeChatId: chat._id, initialMessage: selectedMsg } 
        });
      }, 1500);

    } catch (err) {
      // 2. CATCH AND DISPLAY THE BACKEND ERROR
      console.error("Failed to start chat", err);
      setError(err.response?.data?.message || 'Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm dark:bg-black/60"
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl pointer-events-auto dark:border-white/10 dark:bg-[#0B0E14]"
            >
              
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-violet/10 text-electric-violet">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contact Seller</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Send a quick request to start the conversation</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {success ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-4"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Chat Created!</h3>
                  <p className="text-slate-500 dark:text-gray-400 mt-2">Redirecting to your inbox...</p>
                </div>
              ) : (
                <div className="p-6">
                  
                  {/* 3. DISPLAY ERROR IF IT EXISTS */}
                  {error && (
                    <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/5">
                    <img 
                      src={product.images?.[0] || product.image} 
                      alt={product.title} 
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{product.title}</h4>
                      <p className="font-black text-electric-violet">
                        {product.isFree || product.price === 0 ? 'FREE' : `₹${product.price}`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        Seller: {product.seller?.fullName || 'Campus Student'}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Select a Message</p>
                  <div className="flex flex-col gap-2 mb-6">
                    {QUICK_MESSAGES.map((msg, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMsg(msg)}
                        className={`text-left w-full rounded-xl border p-4 text-sm transition-all ${
                          selectedMsg === msg 
                            ? 'border-electric-violet bg-electric-violet/5 text-electric-violet font-semibold dark:bg-electric-violet/10' 
                            : 'border-slate-200 bg-transparent text-slate-600 hover:border-electric-violet/50 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/30'
                        }`}
                      >
                        {msg}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleSend}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-electric-violet py-4 font-bold text-white transition-all hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <span>Send Request</span>
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};