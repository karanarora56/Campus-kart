import { useState } from 'react';
import { Link } from 'react-router-dom'; // 1. IMPORT LINK
import { MessageSquare, Clock, Tag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AuthModal } from './AuthModal';

export const ProductCard = ({ product }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleActionClick = (e) => {
    e.preventDefault(); // Prevent link navigation if they click the button
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      console.log("Open Contact Modal for:", product.title);
    }
  };

  const getBadgeColor = (condition) => {
    switch (condition.toUpperCase()) {
      case 'NEW': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'LIKE NEW': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400';
      case 'USED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400';
      case 'REFURBISHED': return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-white/10 dark:text-gray-300';
    }
  };

  return (
    <>
      <div className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-xl dark:border-white/5 dark:bg-[#12161f]">
        
        {/* 2. WRAP IMAGE & DETAILS IN A LINK */}
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative aspect-4/5 w-full overflow-hidden bg-slate-100 dark:bg-black/50">
            <img 
              src={product.image} 
              alt={product.title} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className={`absolute top-3 right-3 rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${getBadgeColor(product.condition)}`}>
              {product.condition}
            </div>
          </div>

          <div className="p-4 pb-0">
            <h3 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">
              {product.title}
            </h3>
            <p className="mt-1 text-xl font-black text-electric-violet">
              {product.price === 0 ? 'FREE' : `₹${product.price}`}
            </p>
            
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Tag size={14} />
                <span>{product.category}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{product.timeAgo}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* 3. KEEP BUTTON OUTSIDE THE LINK SO IT DOESN'T REDIRECT */}
        <div className="p-4 pt-4">
          <button 
            onClick={handleActionClick}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
              isAuthenticated 
                ? 'bg-electric-violet/10 text-electric-violet hover:bg-electric-violet hover:text-white dark:bg-white/5 dark:text-white dark:hover:bg-electric-violet' 
                : 'bg-slate-100 text-slate-600 hover:bg-electric-violet hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] dark:bg-white/5 dark:text-gray-300'
            }`}
          >
            <MessageSquare size={16} />
            {isAuthenticated ? 'Contact Seller' : 'Login to Contact'}
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};