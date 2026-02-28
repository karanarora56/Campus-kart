import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2, Tag, MapPin, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const CATEGORIES = ['Academics', 'Electronics', 'Stationery', 'Cycles', 'Lab Coats', 'Daily Use', 'Hardware', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished', 'Heavily Used'];

export const PostItem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academics',
    price: '',
    condition: 'Used',
    preferredMeetupSpot: '',
    isFree: false,
    postType: 'Listing'
  });

  // Image State
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Handle Text Input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Image Selection & Preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check limits (Max 5 images)
    if (images.length + files.length > 5) {
      setError('You can only upload a maximum of 5 images.');
      return;
    }

    // Verify sizes (5MB max per image)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);
    
    // Generate preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove an image before uploading
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Please upload at least one image of the item.');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // UX Tweak
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Build Multipart Form Data
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('preferredMeetupSpot', formData.preferredMeetupSpot);
      data.append('postType', formData.postType);
      data.append('isFree', formData.isFree);
      
      // Only append price if it's not free
      if (!formData.isFree) {
        data.append('price', formData.price);
      }

      // Append all images
      images.forEach((image) => {
        data.append('images', image); // Must match the backend 'upload.array("images")'
      });

      // Send to backend
      await axiosInstance.post('/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => navigate('/explore'), 2000); // Redirect to explore feed
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post item. Please try again.');
      // UX Tweak: Scroll to top instantly so they see the red error box
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
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Item Posted!</h2>
        <p className="mt-2 text-slate-500 dark:text-gray-400">Your item is now live on the campus feed.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Post an Item</h1>
        <p className="mt-2 text-slate-500 dark:text-gray-400">Snap a picture, set a price, and connect with a buyer on campus.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* IMAGE UPLOAD SECTION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Photos (Max 5)</h3>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {/* Image Previews */}
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

            {/* Upload Button */}
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Item Details</h3>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Title</label>
            <input
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Engineering Drawing Kit"
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Description</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the item, reason for selling, any flaws..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet dark:border-white/20 dark:text-white"
            ></textarea>
          </div>
        </div>

        {/* PRICING & LOGISTICS */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pricing & Logistics</h3>

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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">Preferred Meetup Spot</label>
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
                placeholder="e.g., Nescafe, Mega Hostel Gate, Library"
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
              <span>Uploading to Secure Cloud...</span>
            </>
          ) : (
            'Post to Campus Feed'
          )}
        </button>
      </form>
    </div>
  );
};