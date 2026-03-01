import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Search, AlertCircle, HelpCircle, CheckCircle2} from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const SkeletonCard = () => (
  <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/5 dark:bg-[#12161f] animate-pulse">
    <div className="aspect-[4/5] w-full bg-slate-200 dark:bg-white/5"></div>
    <div className="p-4">
      <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-white/10 mb-3"></div>
      <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-white/10 mb-4"></div>
      <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/5"></div>
    </div>
  </div>
);

export const Found = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoundFeed = async () => {
      try {
        // Hitting your pre-built backend route!
        const { data } = await axiosInstance.get('/products/found-feed');
        setItems(data.products);
      } catch (error) {
        console.error("Failed to fetch lost & found items", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoundFeed();
  }, []);

  const getBadgeStyle = (type) => {
    if (type === 'Lost') return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400';
    if (type === 'Found') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400';
    return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-white/10 dark:text-gray-300';
  };

  return (
    <div className="w-full pb-10">
      
      {/* HERO SECTION */}
      <div className="mb-10 text-center md:text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
          <HelpCircle size={18} />
          Campus Recovery
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
          Lost & <span className="text-electric-violet">Found</span>
        </h1>
        <p className="mt-4 text-lg text-slate-500 dark:text-gray-400 max-w-2xl">
          Help reunite fellow students with their missing gear. If you've found something on campus, post it here and earn massive Karma Points!
        </p>
      </div>

      {/* MASONRY GRID & SKELETONS */}
      {loading ? (
        <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 dark:border-white/10">
          <Search size={48} className="text-slate-300 dark:text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-slate-500 dark:text-gray-400">Nothing missing right now</h3>
          <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">The campus is perfectly in order.</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
          {items.map((item) => (
            <Link key={item._id} to={`/product/${item._id}`} className="group block mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-xl dark:border-white/5 dark:bg-[#12161f]">
              
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-black/50">
                <img 
                  src={item.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=Image+Unavailable'; }}
                  alt={item.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* LOST / FOUND BADGE */}
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-black tracking-wider uppercase backdrop-blur-md ${getBadgeStyle(item.postType)}`}>
                  {item.postType === 'Lost' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  {item.postType}
                </div>
              </div>

              <div className="p-5">
                <h3 className="line-clamp-2 text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h3>
                
                <div className="mt-4 flex flex-col gap-2 text-xs font-semibold text-slate-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-electric-violet" />
                    <span className="truncate">Last seen: {item.preferredMeetupSpot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>Reported {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    {item.postType === 'Lost' ? 'Looking for: ' : 'Found by: '}
                    <span className="font-bold text-slate-900 dark:text-white">{item.seller?.fullName || 'Student'}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};