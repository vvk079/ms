// utils/seed.js
// Seeds the database with the RICHBAYY catalogue, an admin user, coupons and
// banners. Run:  npm run seed      (import)
//               npm run seed:destroy  (wipe)
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import Otp from '../models/Otp.js';
import { categories, products, coupons, banners } from './seedData.js';

const isProd = process.env.NODE_ENV === 'production';

const destroy = process.argv.includes('--destroy');

const run = async () => {
  await connectDB();
  try {
    // Clean slate.
    await Promise.all([
      Product.deleteMany(), Category.deleteMany(), Coupon.deleteMany(),
      Banner.deleteMany(), Review.deleteMany(), Order.deleteMany(),
      Counter.deleteMany(), // reset order-number sequence (starts fresh at RB1001)
      Otp.deleteMany(),
      User.deleteMany({ role: { $ne: 'preserve' } }), // wipe all users
    ]);
    // Reconcile indexes with the current schema (e.g. email unique→sparse, add
    // the sparse-unique phone index) so phone-only accounts don't collide.
    await User.syncIndexes();
    console.log('🧹  Cleared existing data');

    if (destroy) {
      console.log('✅  Database wiped clean.');
      return process.exit(0);
    }

    // Admin user (password hashed by the model hook). In production the password
    // MUST come from the environment — never ship a well-known default admin login.
    if (isProd && !process.env.ADMIN_PASSWORD) {
      console.error('❌  ADMIN_PASSWORD is required when seeding in production.');
      return process.exit(1);
    }
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Richbayy Admin',
      email: process.env.ADMIN_EMAIL || 'admin@richbayy.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    });
    console.log(`👤  Admin: ${admin.email}`);

    // A demo customer for local testing only — never seeded in production.
    if (!isProd) {
      await User.create({ name: 'Vivek Shekhawat', email: 'demo@richbayy.com', password: 'Demo@12345', role: 'user', phone: '+91 98765 43210' });
      console.log('👤  Demo: demo@richbayy.com / Demo@12345');
    }

    // Categories → map name to _id.
    const createdCats = await Category.insertMany(
      categories.map((c, i) => ({ ...c, order: i, slug: undefined }))
    );
    const catMap = new Map(createdCats.map((c) => [c.name, c._id]));
    console.log(`🗂️   ${createdCats.length} categories`);

    // Products — expand into the schema shape.
    const baseMin = 4;
    const productDocs = products.map((p, i) => ({
      name: p.name,
      description: p.description,
      brand: 'RICHBAYY',
      category: catMap.get(p.category),
      gender: 'Men',
      price: p.price,
      discountPrice: p.discountPrice || 0,
      material: p.material,
      tint: p.tint,
      colors: p.colors,
      images: (p.images || []).map((url) => ({ url, fileId: '' })),
      sizes: [
        { size: 'XS', stock: baseMin + (i % 3) },
        { size: 'S', stock: 8 + (i % 5) },
        { size: 'M', stock: 12 + (i % 6) },
        { size: 'L', stock: 10 + (i % 4) },
        { size: 'XL', stock: 6 + (i % 3) },
        { size: 'XXL', stock: 3 + (i % 2) },
      ],
      SKU: `RB-${String(i + 1).padStart(4, '0')}`,
      featured: !!p.featured,
      newArrival: !!p.newArrival,
      bestSeller: !!p.bestSeller,
      rating: 4.5 + ((i % 5) * 0.1),
      numReviews: 40 + i * 12,
      soldCount: 120 - i * 6,
    }));
    const createdProducts = await Product.insertMany(productDocs);
    console.log(`👕  ${createdProducts.length} products`);

    // A few seeded reviews on the first product for a lively PDP.
    const demoUser = await User.findOne({ email: 'demo@richbayy.com' });
    const reviewSamples = [
      { name: 'Arjun Mehta', rating: 5, comment: 'The fabric feels premium and super comfortable. Perfect for summer!' },
      { name: 'Rohit Sharma', rating: 5, comment: 'Great fit and looks exactly like the pictures. Highly recommended.' },
      { name: 'Karan Malhotra', rating: 4, comment: 'Loved the colour and quality. Will buy more from RICHBAYY.' },
    ];
    // Only the demo user can own a real review (unique index); others are display-only aggregates.
    if (demoUser) {
      await Review.create({ product: createdProducts[0]._id, user: demoUser._id, name: reviewSamples[0].name, rating: 5, comment: reviewSamples[0].comment, verified: true });
    }

    await Coupon.insertMany(coupons);
    console.log(`🎟️   ${coupons.length} coupons (try WELCOME10)`);

    await Banner.insertMany(banners);
    console.log(`🖼️   ${banners.length} banners`);

    console.log('\n✅  Seed complete. Start the API with `npm run dev`.');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  }
};

run();
