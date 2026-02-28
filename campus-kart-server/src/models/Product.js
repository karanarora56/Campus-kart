import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  
  // --- PRICE LOGIC ---
  isFree: { type: Boolean, default: false },
  price: { 
    type: Number, 
    required: function() { return !this.isFree && this.postType === 'Listing'; }, 
    default: 0 
  },
  
  // --- UPDATED CATEGORIES TO MATCH FRONTEND ---
  category: { 
    type: String, 
    required: true,
    enum: ['Academics', 'Electronics', 'Stationery', 'Cycles', 'Lab Coats', 'Daily Use', 'Hardware', 'Others']
  },

  // --- ADMIN & REPORTING ---
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, enum: ['Prohibited Item', 'Scam/Fraud', 'Wrong Category', 'Harassment', 'Other', 'Inappropriate Content'] },
    status: { type: String, enum: ['pending', 'ignored', 'resolved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // --- VISIBILITY & STATUS ---
  isAdminRemoved: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  status: { type: String, enum: ['Available', 'Pending', 'Sold', 'Claimed'], default: 'Available' },

  // --- IMAGES ---
  images: [{ type: String, required: true }], 

  // --- REMOVED ENUM: Now students can type any spot (e.g., "Mega Hostel") ---
  preferredMeetupSpot: { 
    type: String, 
    required: true 
  },

  // --- UPDATED CONDITIONS TO MATCH FRONTEND ---
  condition: { 
    type: String, 
    enum: ['New', 'Like New', 'Used', 'Refurbished', 'Heavily Used'], 
    default: 'Used' 
  },
  
  karmaPointsAwarded: { type: Boolean, default: false }, // For rewarding finders

  // --- POST TYPE LOGIC ---
  postType: { 
    type: String, 
    enum: ['Listing', 'Lost', 'Found'], 
    default: 'Listing' 
  },
  isRecovered: { type: Boolean, default: false }
  
}, { timestamps: true });

// --- HIGH-END SEARCH INDEX ---
// This allows students to search all posts by text
productSchema.index({ title: 'text', description: 'text' });

productSchema.pre('save', function(next) {
  if (this.isFree || this.postType !== 'Listing') {
    this.price = 0;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;