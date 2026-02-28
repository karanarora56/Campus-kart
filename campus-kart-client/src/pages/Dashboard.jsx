import { useState, useEffect } from 'react';
import { Package, Leaf, ShieldCheck, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import axiosInstance from '../utils/axiosInstance';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const currentUser = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser); // Needed to update Karma Points live
  
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const { data } = await axiosInstance.get('/products/me');
        setMyItems(data.products);
      } catch (error) {
        console.error("Failed to fetch your items", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchMyItems();
  }, [currentUser]);

  // --- CONNECTED: MARK AS SOLD ---
  const markAsSold = async (productId) => {
    try {
      // 1. Tell the backend to mark it sold and calculate karma
      const response = await axiosInstance.patch(`/products/${productId}/sold`);
      
      // 2. Update the local grid so the SOLD banner appears instantly
      setMyItems(myItems.map(item => 
        item._id === productId ? { ...item, status: 'Sold' } : item
      ));

      // 3. Update the user's Karma Points in the global store!
      if (response.data.data) {
        setUser({
          ...currentUser,
          sustainabilityScore: response.data.data.newScore,
          impactLevel: response.data.data.currentLevel
        });
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert(error.response?.data?.message || "Failed to mark as sold.");
    }
  };

  // --- CONNECTED: DELETE ITEM ---
  const deleteItem = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
    
    try {
      await axiosInstance.delete(`/products/${productId}`);
      // Remove it from the grid instantly
      setMyItems(myItems.filter(item => item._id !== productId));
    } catch (error) {
      console.error("Failed to delete", error);
      alert(error.response?.data?.message || "Failed to delete item.");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-6xl pb-20">
      
      {/* PROFILE HEADER */}
      <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0B0E14]">
        <div className="h-32 bg-gradient-to-r from-electric-violet to-blue-600 opacity-90"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-4 flex items-end justify-between">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-3xl font-black text-electric-violet shadow-lg dark:border-[#0B0E14] dark:bg-white/10">
              {currentUser.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 font-bold text-emerald-600 dark:text-emerald-400">
              <Leaf size={18} />
              {/* This score will now update live! */}
              <span>{currentUser.sustainabilityScore || 0} Karma Pts</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {currentUser.fullName}
              <ShieldCheck className="text-blue-500" size={24} />
            </h1>
            <p className="text-slate-500 dark:text-gray-400 font-medium mt-1">
              {currentUser.branch} • Batch of {currentUser.batch}
            </p>
          </div>
        </div>
      </div>

      {/* MY ITEMS SECTION */}
      <div className="mb-6 flex items-center gap-3">
        <Package className="text-electric-violet" size={24} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Campus Listings</h2>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-electric-violet" size={40} />
        </div>
      ) : myItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 dark:border-white/10">
          <Package size={48} className="mb-4 text-slate-300 dark:text-white/20" />
          <h3 className="text-xl font-bold text-slate-500 dark:text-gray-400">No items listed yet</h3>
          <Link to="/post" className="mt-4 font-bold text-electric-violet hover:underline">
            Post your first item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myItems.map((item) => (
            <div key={item._id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg dark:border-white/5 dark:bg-[#12161f]">
              <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-white/5">
                {/* Fallback image handler added just in case */}
                <img 
                  src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Unavailable'; }}
                  alt={item.title} 
                  className="h-full w-full object-cover" 
                />
                
                {item.status === 'Sold' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                    <span className="rounded-xl border-2 border-white px-4 py-2 text-xl font-black tracking-widest text-white uppercase transform -rotate-12">SOLD</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-1 font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-1 font-black text-electric-violet">
                  {item.price === 0 ? 'FREE' : `₹${item.price}`}
                </p>
                
                <div className="mt-auto pt-4 flex gap-2">
                  <button 
                    disabled={item.status === 'Sold'}
                    onClick={() => markAsSold(item._id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed dark:text-emerald-400"
                  >
                    <CheckCircle2 size={16} />
                    {item.status === 'Sold' ? 'Sold Out' : 'Mark Sold'}
                  </button>
                  <button 
                    onClick={() => deleteItem(item._id)}
                    className="flex items-center justify-center rounded-xl bg-red-500/10 p-2.5 text-red-600 transition-colors hover:bg-red-500 hover:text-white dark:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};