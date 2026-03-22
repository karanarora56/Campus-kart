import { useState } from 'react';
import { Link } from 'react-router-dom'; 
import { MessageSquare, Clock, Tag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { AuthModal } from './AuthModal';
import { ContactModal } from './ContactModal'; // <--- ADDED IMPORT
import axiosInstance from '../utils/axiosInstance';

export const ProductCard = ({ product }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const currentUser = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // <--- ADDED STATE
  
  // Check if this specific product's ID is inside the user's savedItems array
  const isSaved = currentUser?.savedItems?.includes(product._id || product.id);

  const handleActionClick = (e) => {
    e.preventDefault(); 
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else setIsContactModalOpen(true); // <--- FIX: ACTUALLY OPENS MODAL
  };

  const handleToggleSave = async (e) => {
    e.preventDefault(); // Stop from navigating to ProductDetail page
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      const { data } = await axiosInstance.post(`/products/${product._id || product.id}/save`);
      // Update global user state instantly
      setUser({ ...currentUser, savedItems: data.savedItems });
    } catch (error) {
      console.error("Failed to save item", error);
    }
  };

  const getBadgeColor = (condition) => {
    switch (condition?.toUpperCase()) {
      case 'NEW': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'LIKE NEW': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400';
      case 'USED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400';
      case 'HEAVILY USED': return 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-white/10 dark:text-gray-300';
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-2xl dark:border-white/5 dark:bg-[#12161f]"
      >
        <Link to={`/product/${product.id || product._id}`} className="block relative">
          <div className="relative aspect-4/5 w-full overflow-hidden bg-slate-100 dark:bg-black/50">
            <img 
              src={product.images?.[0] || product.image || 'https://via.placeholder.com/400x500?text=No+Image'} 
              alt={product.title} 
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* OVERLAY BADGES */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* Heart Button */}
              <button 
                onClick={handleToggleSave}
                className="rounded-full bg-white/80 p-2 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:text-red-500 dark:bg-black/50 dark:text-gray-400 dark:hover:text-red-500"
              >
                <Heart size={18} className={isSaved ? "fill-red-500 text-red-500" : ""} />
              </button>

              {/* Condition Badge */}
              {product.condition && product.postType === 'Listing' && (
                <div className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm ${getBadgeColor(product.condition)}`}>
                  {product.condition}
                </div>
              )}
            </div>
            
            {/* SOLD OVERLAY */}
            {product.status === 'Sold' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <span className="rounded-xl border-2 border-white px-4 py-2 text-xl font-black tracking-widest text-white uppercase transform -rotate-12">SOLD</span>
              </div>
            )}
          </div>

          <div className="p-4 pb-0">
            <h3 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">
              {product.title}
            </h3>
            <p className="mt-1 text-xl font-black text-electric-violet">
              {product.isFree || product.price === 0 ? 'FREE' : `₹${product.price}`}
            </p>
            
            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <Tag size={14} className="shrink-0" />
                <span className="truncate">{product.category}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock size={14} />
                <span>{new Date(product.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="p-4 pt-4">
          <button 
            onClick={handleActionClick}
            disabled={product.status === 'Sold'}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
              product.status === 'Sold' ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5 dark:text-gray-600' :
              isAuthenticated 
                ? 'bg-electric-violet/10 text-electric-violet hover:bg-electric-violet hover:text-white dark:bg-white/5 dark:text-white dark:hover:bg-electric-violet' 
                : 'bg-slate-100 text-slate-600 hover:bg-electric-violet hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] dark:bg-white/5 dark:text-gray-300'
            }`}
          >
            <MessageSquare size={16} />
            {product.status === 'Sold' ? 'Unavailable' : isAuthenticated ? 'Contact Seller' : 'Login to Contact'}
          </button>
        </div>
      </motion.div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {/* FIX: ADDED CONTACT MODAL SO IT ACTUALLY OPENS */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} product={product} />
    </>
  );
};