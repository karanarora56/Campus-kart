import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Trash2, UserX, UserCheck, CheckCircle, AlertOctagon, Loader2, Info, Users, Crown, Shield, History, X } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { useStore } from '../store/useStore';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for the Audit Trail Modal
  const [historyModal, setHistoryModal] = useState({ isOpen: false, user: null });

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/explore');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'reports') {
          const { data } = await axiosInstance.get('/admin/reports');
          setReports(data.data || []);
        } else {
          const { data } = await axiosInstance.get('/admin/users');
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, activeTab, navigate]);

  // --- REPORT ACTIONS ---
  const handleDeletePost = async (productId) => {
    if (!window.confirm("WARNING: Force remove this post from the campus feed?")) return;
    try {
      await axiosInstance.delete(`/admin/product/${productId}`);
      setReports(reports.filter(r => r._id !== productId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete");
    }
  };

  const handleClearReports = async (productId) => {
    if (!window.confirm("Mark this post as safe and clear all reports?")) return;
    try {
      await axiosInstance.patch(`/admin/product/${productId}/clear-reports`);
      setReports(reports.filter(r => r._id !== productId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to clear");
    }
  };

  // --- USER ACTIONS (NOW WITH REASONS & HISTORY) ---
  const handleBanUser = async (userId) => {
    // Advanced: Ask the admin for a reason to save in the DB history
    const reason = window.prompt("Enter reason for banning this user (saved to audit trail):", "Violation of campus guidelines");
    if (reason === null) return; // Admin clicked cancel

    try {
      await axiosInstance.post(`/admin/ban`, { userId, reason });
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: true } : u));
      alert("User banned and listings hidden successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to ban");
    }
  };

  const handleUnbanUser = async (userId) => {
    const reason = window.prompt("Enter reason for unbanning this user:", "Account restored after review");
    if (reason === null) return;

    try {
      await axiosInstance.post(`/admin/unban`, { userId, reason });
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: false } : u));
      alert("User restored successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to unban");
    }
  };

  const handlePromote = async (userId) => {
    if (!window.confirm("Promote this student to Admin? They will get full access!")) return;
    try {
      await axiosInstance.patch(`/admin/promote/${userId}`);
      setUsers(users.map(u => u._id === userId ? { ...u, role: 'admin' } : u));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to promote");
    }
  };

  const handleViewHistory = async (userId) => {
    try {
      const { data } = await axiosInstance.get(`/admin/history/${userId}`);
      setHistoryModal({ isOpen: true, user: data.data });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch history");
    }
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl pb-20">
      
      {/* HEADER */}
      <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 dark:bg-red-500/10">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <AlertOctagon size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Admin Command Center</h1>
        </div>
        <p className="text-slate-600 dark:text-gray-400 font-medium ml-16">
          Review flagged content, manage campus users, and monitor audit trails.
        </p>
      </div>

      {/* TABS */}
      <div className="mb-8 flex gap-4 border-b border-slate-200 pb-px dark:border-white/10">
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-bold transition-all ${
            activeTab === 'reports' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <ShieldAlert size={20} /> Active Reports
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-bold transition-all ${
            activeTab === 'users' ? 'border-electric-violet text-electric-violet' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Users size={20} /> User Database
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className={`animate-spin ${activeTab === 'reports' ? 'text-red-500' : 'text-electric-violet'}`} size={40} />
        </div>
      ) : activeTab === 'reports' ? (
        
        /* --- REPORTS TAB --- */
        reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/30 py-20 bg-emerald-500/5">
            <CheckCircle size={48} className="mb-4 text-emerald-500" />
            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Campus is Secure</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reports.map((product) => (
              <div key={product._id} className="flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#12161f]">
                <div className="flex flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
                  <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt="flagged" className="h-24 w-24 rounded-xl object-cover" />
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{product.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.reports?.map((report, idx) => (
                        <span key={idx} className="flex items-center gap-1 rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 border border-red-500/20">
                          <Info size={12} /> {report.reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-6 bg-slate-50 dark:bg-black/20 md:w-80">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Posted By</p>
                    <p className="font-bold text-slate-900 dark:text-white">{product.seller?.fullName}</p>
                    {product.seller?.isBanned && <span className="mt-1 inline-block rounded bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">BANNED USER</span>}
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <button onClick={() => handleClearReports(product._id)} className="flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-white">
                      <CheckCircle size={16} /> Mark as Safe
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleDeletePost(product._id)} className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 py-2.5 text-sm font-bold text-red-600 hover:bg-red-500 hover:text-white">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (

        /* --- USERS TAB --- */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div key={user._id} className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#12161f] ${user.isBanned ? 'opacity-70 grayscale border-red-500/30' : ''}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-electric-violet dark:bg-white/10">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    {user.fullName}
                    {user.role === 'admin' && <Crown size={16} className="text-amber-500 shrink-0" />}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
                {/* NEW: View History Button */}
                <button onClick={() => handleViewHistory(user._id)} className="col-span-2 mb-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors">
                  <History size={14} /> View Audit History
                </button>

                {user.role === 'student' && !user.isBanned && (
                  <button onClick={() => handlePromote(user._id)} className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 py-2 text-xs font-bold text-amber-600 hover:bg-amber-500 hover:text-white transition-colors">
                    <Shield size={14} /> Make Admin
                  </button>
                )}
                
                {user.role === 'student' && user.isBanned ? (
                  <button onClick={() => handleUnbanUser(user._id)} className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                    <UserCheck size={14} /> Restore User
                  </button>
                ) : user.role === 'student' ? (
                  <button onClick={() => handleBanUser(user._id)} className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 py-2 text-xs font-bold text-red-600 hover:bg-red-500 hover:text-white transition-colors">
                    <UserX size={14} /> Ban User
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODERATION HISTORY MODAL --- */}
      {historyModal.isOpen && historyModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-white/5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Audit History</h3>
                <p className="text-xs text-slate-500">{historyModal.user.fullName} ({historyModal.user.email})</p>
              </div>
              <button onClick={() => setHistoryModal({ isOpen: false, user: null })} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-6">
              {historyModal.user.moderationHistory?.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8">No moderation history for this user.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {historyModal.user.moderationHistory.map((record, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          record.action === 'BAN' ? 'bg-red-500/20 text-red-600' : 
                          record.action === 'UNBAN' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                        }`}>
                          {record.action}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {record.createdAt || record.date 
                            ? new Date(record.createdAt || record.date).toLocaleDateString() 
                            : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Reason: {record.reason}</p>
                      <p className="text-xs text-slate-500">Performed by: {record.performedBy?.fullName || 'System'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};