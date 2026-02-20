import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[\w.]+@nitj\.ac\.in$/, 'Only @nitj.ac.in emails are allowed']
  },
  password: { type: String, required: true },

  role: { 
    type: String, 
    enum: ['student', 'admin'], 
    default: 'student' 
  },

  // --- AUTOMATED VERIFICATION (OTP) ---
  isEmailVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },

  // --- CAMPUS DATA ---
  branch: { 
    type: String, 
    required: true, 
    enum: ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'ICE', 'BT', 'CH', 'TT'],
    default: 'CSE' 
  },
  batch: { type: Number, required: true, min: 2020, max: 2040 },

  // --- ENHANCED ADMIN MODERATION ---
  isBanned: { type: Boolean, default: false },
  isAccountActive: { type: Boolean, default: true }, 
  
  // Stores the full history of Admin actions for this user
  moderationHistory: [{
    action: { type: String, enum: ['BAN', 'UNBAN','PROMOTION'] },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to Admin
  }],

  // --- TRUST & REWARDS ---
  sustainabilityScore: { type: Number, default: 0 },
  hasRoommateBadge: { type: Boolean, default: false },
impactLevel: {
  type: String,
  enum: ['Seedling', 'Sprout', 'Tree', 'Forest Guardian'],
  default: 'Seedling'
},

}, { timestamps: true });

// High-End Security: Automatically hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Helper method to compare passwords during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;