import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2, Tag, MapPin, CheckCircle2, AlertCircle, HelpCircle, Package } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const CATEGORIES = [
  'Scientific Calculators', 'Drafters', 'Lab Coats/Aprons', 'Study Tables', 
  'Laptops/Peripherals', 'Mobile Phones', 'Books & PYQs', 'Hostel Appliances',
  'Electronics', 'Documents/Cards', 'Keys', 'Engineering Gear', 'Personal Items'
];
const CONDITIONS = ['New', 'Like New', 'Used', 'Heavily Used'];
const POST_TYPES = ['Listing', 'Lost', 'Found'];

export const PostItem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    price: '',
    condition: 'Used',
    preferredMeetupSpot: '',
    isFree: false,
    postType: 'Listing' // Now connected to the UI!
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('You can only upload a maximum of 5 images.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setError('');
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Please upload at least one image of the item.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('preferredMeetupSpot', formData.preferredMeetupSpot);
      data.append('postType', formData.postType);
      
      // Auto-set isFree to true if it's a Lost/Found item, otherwise use the checkbox
      const isItemFree = formData.postType !== 'Listing' ? true : formData.isFree;
      data.append('isFree', isItemFree);
      
      if (!isItemFree && formData.postType === 'Listing') {
        data.append('price', formData.price);
      }

      images.forEach((image) => {
        data.append('images', image); 
      });

      await axiosInstance.post('/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      
      // Redirect dynamically based on what they posted
      setTimeout(() => {
        if (formData.postType === 'Listing') navigate('/explore');
        else navigate('/found');
      }, 2000); 
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post item. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          {formData.postType === 'Listing' ? 'Item Posted!' : 'Report Submitted!'}
        </h2>
        <p className="mt-2 text-slate-500 dark:text-gray-400">
          {formData.postType === 'Listing' 
            ? 'Your item is now live on the campus feed.' 
            : 'Your report is now live on the Found Feed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create a Post</h1>
        <p className="mt-2 text-slate-500 dark:text-gray-400">Sell an item, or report something lost/found on campus.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* --- POST TYPE TOGGLE --- */}
        <div className="flex rounded-xl bg-slate-200/50 p-1.5 dark:bg-white/5">
          {POST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, postType: type }))}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
                formData.postType === type
                  ? 'bg-white text-electric-violet shadow-sm dark:bg-[#12161f] dark:text-electric-violet'
                  : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {type === 'Listing' && <Package size={16} />}
              {type === 'Lost' && <AlertCircle size={16} />}
              {type === 'Found' && <HelpCircle size={16} />}
              {type === 'Listing' ? 'Sell Item' : `Report ${type}`}
            </button>
          ))}
        </div>

        {/* IMAGE UPLOAD SECTION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Photos (Max 5)</h3>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-electric-violet hover:bg-electric-violet/5 dark:border-white/20 dark:bg-black/20 dark:hover:border-electric-violet">
                <UploadCloud size={24} className="text-slate-400 dark:text-gray-500" />
                <span className="mt-2 text-xs font-semibold text-slate-500 dark:text-gray-400">Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {formData.postType === 'Listing' ? 'Item Details' : 'Missing/Found Item Details'}
          </h3>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Title</label>
            <input
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={formData.postType === 'Listing' ? "e.g., Engineering Drawing Kit" : "e.g., Blue Nike Water Bottle"}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white dark:bg-[#12161f]"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            {/* Hide Condition if it's Lost/Found as it's not very relevant */}
            {formData.postType === 'Listing' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white dark:bg-[#12161f]"
                >
                  {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Description</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder={formData.postType === 'Listing' ? "Describe the item, reason for selling..." : "Describe where you lost/found it, identifying marks..."}
              className="w-full resize-none rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white"
            ></textarea>
          </div>
        </div>

        {/* PRICING & LOGISTICS */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {formData.postType === 'Listing' ? 'Pricing & Logistics' : 'Location Details'}
          </h3>

          {/* ONLY SHOW PRICING IF IT'S A LISTING */}
          {formData.postType === 'Listing' && (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <input
                  type="checkbox"
                  id="isFree"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleChange}
                  className="h-5 w-5 accent-electric-violet"
                />
                <label htmlFor="isFree" className="flex flex-col cursor-pointer">
                  <span className="font-bold text-amber-600 dark:text-amber-500">Free Giveaway</span>
                  <span className="text-xs text-slate-600 dark:text-gray-400">Give this item away for free to boost your Sustainability Score!</span>
                </label>
              </div>

              {!formData.isFree && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Price (₹)</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Tag size={18} className="text-slate-400" />
                    </div>
                    <input
                      required={!formData.isFree}
                      type="number"
                      name="price"
                      min="1"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g., 500"
                      className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 pl-12 text-slate-900 placeholder-slate-400 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {formData.postType === 'Listing' ? 'Preferred Meetup Spot' : 'Last Seen / Found Location'}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MapPin size={18} className="text-slate-400" />
              </div>
              <input
                required
                type="text"
                name="preferredMeetupSpot"
                value={formData.preferredMeetupSpot}
                onChange={handleChange}
                placeholder="e.g., Central Library, BH-1, Snackers"
                className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 pl-12 text-slate-900 placeholder-slate-400 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-electric-violet py-4 text-lg font-bold text-white transition-all duration-300 hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>
              {formData.postType === 'Listing' ? 'Post to Campus Feed' : `Report ${formData.postType} Item`}
            </span>
          )}
        </button>
      </form>
    </div>
  );
};