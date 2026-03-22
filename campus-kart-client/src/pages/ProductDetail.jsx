import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag, ShieldCheck, Leaf, MessageSquare, Loader2, Flag, X, AlertTriangle } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { useStore } from '../store/useStore';
import { AuthModal } from '../components/AuthModal';
import { ContactModal } from '../components/ContactModal';

const REPORT_REASONS = [
  'Prohibited Item', 'Scam/Fraud', 'Wrong Category', 
  'Harassment', 'Inappropriate Content', 'Other'
];

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const currentUser = useStore((state) => state.user);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // --- NEW: REPORT STATE ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axiosInstance.get(`/products/${id}`);
        setProduct(data.product);
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-electric-violet" size={40} /></div>;
  }

  if (!product) {
    return <div className="p-10 text-center text-xl text-slate-500">Product not found.</div>;
  }

  const isOwner = currentUser && product && (
    String(currentUser._id || currentUser.id) === String(product.seller?._id || product.seller)
  );

  const handleContact = () => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else setIsContactModalOpen(true);
  };

  // --- NEW: HANDLE REPORT SUBMISSION ---
  const submitReport = async () => {
    if (!isAuthenticated) {
      setIsReportModalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      setIsReporting(true);
      const response = await axiosInstance.post(`/products/${product._id}/report`, { reason: reportReason });
      alert(response.data.message || "Item reported successfully. Admins will review it.");
      setIsReportModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-20 relative">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-electric-violet dark:text-gray-400 dark:hover:text-electric-violet transition-colors">
          <ArrowLeft size={20} />
          <span className="font-semibold">Back to Feed</span>
        </button>
        
        {/* NEW: REPORT BUTTON */}
        {!isOwner && (
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors dark:text-gray-500 dark:hover:text-red-400"
          >
            <Flag size={16} /> Report Post
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* LEFT COL: Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-black/50">
            <img 
              src={product.images[activeImage]} 
              alt={product.title} 
              className="h-full w-full object-cover" 
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${activeImage === idx ? 'border-electric-violet' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="thumbnail" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COL: Product Details */}
        <div className="flex flex-col">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-white/5 dark:text-gray-300 w-max">
            <Tag size={14} />
            {product.category}
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
            {product.title}
          </h1>
          
          <div className="mt-4 flex items-end gap-4">
            {product.postType === 'Listing' ? (
              <>
                <span className="text-4xl font-black text-electric-violet">
                  {product.isFree ? 'FREE' : `₹${product.price}`}
                </span>
                <span className="mb-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                  {product.condition}
                </span>
              </>
            ) : (
              <span className={`text-4xl font-black tracking-wider uppercase ${product.postType === 'Lost' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {product.postType} ITEM
              </span>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#12161f]">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Description</h3>
            <p className="whitespace-pre-wrap text-slate-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">Preferred Meetup</p>
                <p className="font-bold text-slate-900 dark:text-white">{product.preferredMeetupSpot}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                    {product.postType === 'Listing' ? 'Seller' : 'Reported By'}
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">{product.seller?.fullName || 'Campus Student'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <Leaf size={16} />
                {product.seller?.sustainabilityScore || 0} pts
              </div>
            </div>
          </div>

          {isOwner ? (
            <div className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 text-lg font-bold text-slate-500 dark:bg-white/5 dark:text-gray-400">
              <ShieldCheck size={20} />
              This is your item
            </div>
          ) : (
            <button 
              onClick={handleContact}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-electric-violet py-4 text-lg font-bold text-white transition-all duration-300 hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            >
              <MessageSquare size={20} />
              {isAuthenticated ? 'Contact Seller' : 'Login to Message Seller'}
            </button>
          )}

        </div>
      </div>
      
      {/* --- NEW: REPORT MODAL --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Report Listing</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-sm text-slate-600 dark:text-gray-400">
                Why are you reporting this post? Our admins will review the item against our community guidelines.
              </p>
              
              <div className="flex flex-col gap-2 mb-6">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`text-left w-full rounded-xl border p-4 text-sm transition-all ${
                      reportReason === reason 
                        ? 'border-red-500 bg-red-500/10 text-red-600 font-bold dark:text-red-400' 
                        : 'border-slate-200 bg-transparent text-slate-600 hover:border-red-500/50 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/30'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <button 
                onClick={submitReport}
                disabled={isReporting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-4 font-bold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {isReporting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} product={product} />
    </div>
  );
};