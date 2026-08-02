// models/Otp.js
// Short-lived one-time passcodes for phone login/registration. The code itself is
// stored HASHED (never plaintext). A TTL index auto-purges expired docs, and an
// attempt counter blocks brute-forcing a 6-digit code. One active OTP per phone.
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true }, // normalised, one active OTP per number
    codeHash: { type: String, required: true },            // sha256 of the 6-digit code
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },                // failed verifications
    lastSentAt: { type: Date, default: Date.now },         // resend throttle
    name: { type: String, default: '' },                   // optional name captured at request time
  },
  { timestamps: true }
);

// TTL: Mongo removes the doc once `expiresAt` passes (checked ~once a minute).
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
