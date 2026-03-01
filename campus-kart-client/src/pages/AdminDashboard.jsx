import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Trash2, UserX, CheckCircle, AlertOctagon, Loader2, Info } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { useStore } from '../store/useStore';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.user);
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/explore');
      return;
    }

    const fetchReports = async () => {
      try {
        // Your backend sends { success: true, count, data: [...] }
        const response = await axiosInstance.get('/admin/reports');
        setReports(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentUser, navigate]);
const handleDeletePost = async (productId) => {
    if (!window.confirm("WARNING: This will remove this post from the campus feed. Continue?")) return;
    try {
      // Hits your removeProductByAdmin controller
      await axiosInstance.delete(`/admin/product/${productId}`);
      setReports(reports.filter(r => r._id !== productId));
    } catch (error) {
      // FIX: We are now using the 'error' variable!
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete product");
    }
  };

  const handleClearReports = async (productId) => {
    if (!window.confirm("Mark this post as safe and clear all reports?")) return;
    try {
      // Hits your clearReports controller
      await axiosInstance.patch(`/admin/product/${productId}/clear-reports`);
      setReports(reports.filter(r => r._id !== productId));
    } catch (error) {
      // FIX: We are now using the 'error' variable!
      console.error(error);
      alert(error.response?.data?.message || "Failed to clear reports");
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm("CRITICAL ACTION: Ban this user and hide all their listings?")) return;
    try {
      // Hits your banUser controller with the required body
      await axiosInstance.post(`/admin/ban`, { userId, reason: "Banned via Admin Dashboard" });
      alert("User has been banned and all their listings are now hidden.");
      // Instantly remove their reported item from the screen
      setReports(reports.filter(r => r.seller?._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to ban user");
    }
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl pb-20">
      
      {/* COMMAND CENTER HEADER */}
      <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 dark:bg-red-500/10">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <AlertOctagon size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Admin Command Center</h1>
        </div>
        <p className="text-slate-600 dark:text-gray-400 font-medium ml-16">
          Review flagged content, ban malicious actors, and keep the campus safe.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-2 font-bold text-slate-800 dark:text-white text-xl">
        <ShieldAlert className="text-red-500" />
        Active Reports ({reports.length})
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-red-500" size={40} />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/30 py-20 bg-emerald-500/5">
          <CheckCircle size={48} className="mb-4 text-emerald-500" />
          <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Campus is Secure</h3>
          <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-2">No active reports require moderation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.map((product) => (
            <div key={product._id} className="flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#12161f]">
              
              {/* Product Info */}
              <div className="flex flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
                <img 
                  src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                  alt="flagged" 
                  className="h-24 w-24 rounded-xl object-cover" 
                />
                <div className="ml-4 flex-1">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Reasons:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.reports?.map((report, idx) => (
                        <span key={idx} className="flex items-center gap-1 rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 border border-red-500/20 dark:text-red-400">
                          <Info size={12} />
                          {report.reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Info & Actions */}
              <div className="flex flex-col justify-between p-6 bg-slate-50 dark:bg-black/20 md:w-80">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Posted By</p>
                  <p className="font-bold text-slate-900 dark:text-white">{product.seller?.fullName}</p>
                  <p className="text-xs text-slate-500">{product.seller?.email}</p>
                  <p className="text-xs text-slate-500">{product.seller?.branch}</p>
                  {product.seller?.isBanned && (
                    <span className="mt-2 inline-block rounded bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">BANNED USER</span>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button 
                    onClick={() => handleClearReports(product._id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-colors"
                  >
                    <CheckCircle size={16} /> Mark as Safe
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleDeletePost(product._id)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 py-2.5 text-sm font-bold text-red-600 hover:bg-red-500 hover:text-white transition-colors dark:text-red-400"
                    >
                      <Trash2 size={16} /> Delete Post
                    </button>
                    <button 
                      disabled={product.seller?.isBanned}
                      onClick={() => handleBanUser(product.seller?._id)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500/10 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50 dark:text-orange-400"
                    >
                      <UserX size={16} /> {product.seller?.isBanned ? 'Banned' : 'Ban User'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};