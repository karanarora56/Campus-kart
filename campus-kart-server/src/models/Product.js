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
  
  // --- NITJ CATEGORIES (Merged Marketplace + Lost/Found) ---
  category: { 
    type: String, 
    required: true,
    enum: [
      'Scientific Calculators', 'Drafters', 'Lab Coats/Aprons', 'Study Tables', 
      'Laptops/Peripherals', 'Mobile Phones', 'Books & PYQs', 'Hostel Appliances',
      'Electronics', 'Documents/Cards', 'Keys', 'Engineering Gear', 'Personal Items'
    ]
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

  // --- NITJ LOCATIONS (Added Department Building) ---
  preferredMeetupSpot: { 
    type: String, 
    enum: [
      'BH-1', 'BH-2', 'BH-5', 'BH-6', 'BH-7', 'Mega Boys Block A', 'Mega Boys Block B', 'Mega Boys Block F', 
      'GH-1', 'GH-2', 'Mega Girls Hostel', 'Nescafe', 'Night Canteen', 'Snackers', 'Yadav Canteen', 
      'Campus Cafe', 'Rim Jhim Bakery', 'Central Library', 'Department Building'
    ],
    default: 'Snackers' 
  },

  // --- SUSTAINABILITY & KARMA ---
  condition: { 
    type: String, 
    enum: ['New', 'Gently Used', 'Heavily Used'], 
    default: 'Gently Used' 
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