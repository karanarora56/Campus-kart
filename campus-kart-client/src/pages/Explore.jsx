import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import axiosInstance from '../utils/axiosInstance';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'Academics', 'Electronics', 'Stationery', 'Cycles', 'Lab Coats', 'Daily Use', 'Hardware', 'Others'];

const SkeletonCard = () => (
  <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/5 dark:bg-[#12161f] animate-pulse">
    <div className="aspect-4/5 w-full bg-slate-200 dark:bg-white/5"></div>
    <div className="p-4">
      <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-white/10 mb-2"></div>
      <div className="h-6 w-1/3 rounded bg-electric-violet/20 mb-4"></div>
      <div className="flex justify-between mb-4">
        <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-white/10"></div>
        <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-white/10"></div>
      </div>
      <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-white/5"></div>
    </div>
  </div>
);

export const Explore = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // NEW: Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce logic: wait 500ms after user stops typing before setting debouncedSearch
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FETCH REAL DATA
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Pass both category and search query parameters cleanly to axios
        const { data } = await axiosInstance.get('/products', {
          params: {
            category: activeCategory !== 'All' ? activeCategory : undefined,
            search: debouncedSearch || undefined // Send search term if it exists
          }
        });
        
       const formattedProducts = data.products.map(p => ({
          id: p._id,
          title: p.title,
          price: p.price,
          condition: p.condition,
          category: p.category,
          image: p.images?.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&w=800&q=80',
          timeAgo: new Date(p.createdAt).toLocaleDateString(),
          status: p.status,
          postType: p.postType, // <--- ADD THIS
          seller: p.seller      // <--- ADD THIS
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, debouncedSearch]); // Re-run when category OR search changes

  return (
    <div className="w-full pb-10">
      
      {/* HERO SECTION */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
          See what's already <span className="text-electric-violet">moving</span> on campus
        </h1>
        <p className="mt-4 text-lg text-slate-500 dark:text-gray-400">
          real stuff, real prices, real close
        </p>
      </div>

      {/* NEW: SEARCH BAR */}
      <div className="mb-6 flex w-full max-w-2xl items-center gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search for calculators, cycles, books..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-electric-violet focus:ring-2 focus:ring-electric-violet/20 dark:border-white/10 dark:bg-[#12161f] dark:text-white"
          />
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="scrollbar-hide mb-8 flex w-full gap-3 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
              activeCategory === cat 
                ? 'bg-electric-violet text-white shadow-[0_4px_15px_rgba(124,58,237,0.3)]' 
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MASONRY GRID & SKELETONS */}
      {loading ? (
        <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 dark:border-white/10">
          <Search size={48} className="text-slate-300 dark:text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-slate-500 dark:text-gray-400">No items found</h3>
          <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">Try searching for something else or changing categories.</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};