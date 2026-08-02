// controllers/userController.js
// Profile updates + address book CRUD (embedded on the user document).
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';

const publicUser = (u) => ({
  _id: u._id, name: u.name, email: u.email, phone: u.phone,
  dob: u.dob, gender: u.gender, role: u.role, avatar: u.avatar, addresses: u.addresses,
  hasPassword: Boolean(u.hasPassword),
});

// @route  PUT /api/users/profile
// `phone` is intentionally NOT editable here: it is the login identifier for the
// OTP flow, so changing it would hand over (or hijack) an account without any
// verification. A phone change must go through a fresh OTP on the new number.
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, email, dob, gender, avatar } = req.body;

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      res.status(400);
      throw new Error('Name cannot be empty');
    }
    user.name = trimmed;
  }

  // Optional email — used for receipts and order updates, never for signing in.
  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase();
    if (trimmed) {
      if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
        res.status(400);
        throw new Error('Please enter a valid email address');
      }
      const taken = await User.findOne({ email: trimmed, _id: { $ne: user._id } }).select('_id');
      if (taken) {
        res.status(409);
        throw new Error('That email is already linked to another account');
      }
      user.email = trimmed;
    } else {
      user.email = undefined; // clearing is allowed — email is optional
    }
  }

  if (dob !== undefined) user.dob = dob;
  if (gender !== undefined) user.gender = gender;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  res.json({ user: publicUser(user) });
});

// ── Address book ─────────────────────────────────────────────

// @route  GET /api/users/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  res.json(req.user.addresses);
});

// @route  POST /api/users/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // First address (or explicitly flagged) becomes the default.
  const makeDefault = req.body.isDefault || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push({ ...req.body, isDefault: makeDefault });
  await user.save();
  res.status(201).json(user.addresses);
});

// @route  PUT /api/users/addresses/:addrId
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addrId);
  if (!addr) {
    res.status(404);
    throw new Error('Address not found');
  }
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(addr, req.body);
  await user.save();
  res.json(user.addresses);
});

// @route  DELETE /api/users/addresses/:addrId
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addrId);
  if (!addr) {
    res.status(404);
    throw new Error('Address not found');
  }
  const wasDefault = addr.isDefault;
  user.addresses = user.addresses.filter((a) => String(a._id) !== req.params.addrId);
  // Promote another address to default if we removed the default one.
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.json(user.addresses);
});
