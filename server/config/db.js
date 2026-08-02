// config/db.js
// Establishes and caches the MongoDB Atlas connection via Mongoose.
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * One-shot, idempotent backfill for accounts created before `hasPassword`
 * existed (the flag lets the UI hide password controls from OTP-only
 * customers). Matches nothing once every document has been updated.
 */
const backfillHasPassword = async () => {
  try {
    const { modifiedCount } = await User.updateMany(
      { hasPassword: { $ne: true }, password: { $exists: true, $ne: null } },
      { $set: { hasPassword: true } }
    );
    if (modifiedCount) console.log(`🔧  Backfilled hasPassword on ${modifiedCount} account(s).`);
  } catch (err) {
    // Never block startup on a cosmetic backfill.
    console.warn(`⚠️   hasPassword backfill skipped: ${err.message}`);
  }
};

/**
 * Connect to MongoDB. Called once at server startup.
 * Fails fast (exit 1) so orchestrators (Render, PM2) can restart cleanly.
 */
const connectDB = async () => {
  try {
    // strictQuery avoids noisy deprecation warnings and enforces schema paths.
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern Mongoose ignores most legacy flags; these keep pools sane.
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 20,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    await backfillHasPassword();
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
