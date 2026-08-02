// server.js — RICHBAYY API entry point
// Boots Express with a hardened security stack, connects Mongo, and mounts routes.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import connectDB from './config/db.js';
import validateEnv from './config/validateEnv.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Fail fast on missing/weak config instead of throwing at the first request.
validateEnv();

// Route modules
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// ── Connect to MongoDB Atlas ─────────────────────────────────
await connectDB();

const app = express();

// Behind a proxy (Render/Vercel) so rate-limit + secure cookies see real IPs.
app.set('trust proxy', 1);

// ── Security & parsing middleware ────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false })); // secure headers
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
    credentials: true, // allow the auth cookie across origins
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());               // strip $ / . from user input (NoSQL injection)
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use('/api', apiLimiter);            // blanket rate limit for the API

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'RICHBAYY API is running ✨' }));
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Mount routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// ── Error handling (must be last) ────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀  RICHBAYY API listening on http://localhost:${PORT} [${process.env.NODE_ENV}]`)
);
