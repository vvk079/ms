// models/User.js
// The user document embeds addresses, cart and wishlist so the account lives in
// one place. Passwords are hashed with bcrypt via a pre-save hook.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Sub-schemas ──────────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },       // Home / Work / Other
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

// A cart line captures the chosen variant so the same product in two sizes stays separate.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,          // denormalised snapshot for fast rendering
    image: String,
    price: Number,         // unit price at time of add (kept in sync on read)
    size: { type: String, required: true },
    color: { type: String, default: '' },
    qty: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    // Email is optional: phone-OTP accounts may have no email. Unique+sparse so
    // many phone-only users (email undefined) don't collide on the index.
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // Password is optional: phone-OTP accounts authenticate via OTP, not a password.
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default queries
    },
    // Mirrors "this account has a password" without loading the hash, so the UI
    // can hide password controls from OTP-only customers. Set by the hash hook.
    hasPassword: { type: Boolean, default: false },
    // Phone is a unique login identifier for OTP accounts (normalised, e.g. +9198…).
    // Unique+sparse so email-only users (phone undefined) don't collide.
    phone: { type: String, unique: true, sparse: true, trim: true },
    phoneVerified: { type: Boolean, default: false },
    dob: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },

    addresses: [addressSchema],
    cart: [cartItemSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Password reset (simple token flow)
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

// ── Hooks ────────────────────────────────────────────────────
// Normalise empty identity fields to `undefined` so the sparse unique indexes
// ignore them (an empty-string '' would otherwise collide across users).
userSchema.pre('save', function (next) {
  if (this.email === '') this.email = undefined;
  if (this.phone === '') this.phone = undefined;
  next();
});

// Hash password whenever it is set/changed.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.hasPassword = true;
  next();
});

// ── Methods ──────────────────────────────────────────────────
userSchema.methods.matchPassword = function (entered) {
  if (!this.password) return Promise.resolve(false); // OTP-only account has no password
  return bcrypt.compare(entered, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
