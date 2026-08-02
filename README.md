# RICHBAYY — Premium Menswear E-Commerce

A production-ready, full-stack **MERN** fashion store for the **RICHBAYY** premium-shirts brand. The UI is a faithful build of the approved *"Elevated Shirts. Everyday Style."* design system — Jost typeface, ink-on-paper palette with warm neutrals and a gold accent, generous whitespace, rounded tiles, glassmorphism touches, scroll-reveal + micro-interactions, and a signature brand intro animation.

```
RichbayyStore/
├── client/   → React 19 + Vite + Tailwind + Framer Motion storefront & admin
├── server/   → Node + Express + MongoDB (Mongoose) REST API
├── render.yaml
└── README.md
```

---

## ✨ Features

**Storefront**
- Home: 3-panel hero, feature strip, shop-by-category, best sellers, new arrivals, brand story, review carousel (Swiper), newsletter
- Shop: search, filters (category, gender, colour, size, price), sort, grid/list, pagination, quick view
- Product detail: image gallery + zoom, colour/size selection, live stock, delivery-pincode check, quantity, add-to-bag / buy-now, wishlist, info accordion, ratings breakdown + review form, related + recently viewed
- Cart (server-persisted): quantity, coupons, shipping estimate, GST-inclusive totals
- Checkout: address book, COD + online-payment-ready module, order placement with stock decrement
- Order success, public order tracking with timeline
- Wishlist, About/brand story, 404

**Accounts & Auth**
- Register / login with **JWT in HTTP-only cookies** + **bcrypt**
- Forgot / reset password, change password
- Profile, order history + cancel, multiple addresses, reviews

**Admin panel** (`/admin`, role-guarded)
- Dashboard KPIs + 7-day sales chart, recent orders, top products, low-stock alerts
- Manage products (with **ImageKit** uploads), categories, orders (status workflow), customers, coupons, inventory, sales report

**Engineering**
- Security: Helmet, CORS (credentialed), rate limiting, express-validator, mongo-sanitize, role-based auth, HTTP-only cookies
- Performance: route-level code-splitting, lazy loading, responsive images, memoisation, pagination, loading skeletons/shimmer
- Clean modular architecture, reusable components, custom hooks, env-driven config, commented throughout

---

## 🧱 Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 19, Vite, React Router, Tailwind CSS, Framer Motion, Axios, React Hook Form, React Hot Toast, Swiper, React Icons |
| Backend   | Node.js, Express.js |
| Database  | MongoDB Atlas (Mongoose) |
| Auth      | JWT, HTTP-only cookies, bcrypt |
| Images    | ImageKit CDN |
| Deploy    | Frontend → Vercel · Backend → Render |

---

## 🚀 Local Setup

### Prerequisites
- Node 18+
- A MongoDB connection string (MongoDB Atlas free tier works)
- *(Optional)* an ImageKit account — only needed for admin image uploads

### 1) Backend
```bash
cd server
cp .env.example .env         # then fill in MONGO_URI, JWT_SECRET, (optional) IMAGEKIT_*
npm install
npm run seed                 # seeds categories, products, coupons, admin + demo user
npm run dev                  # → http://localhost:5000
```

### 2) Frontend
```bash
cd client
cp .env.example .env         # leave VITE_API_URL=/api for local (Vite proxies to :5000)
npm install
npm run dev                  # → http://localhost:5173
```

### Demo credentials (created by the seed)
| Role  | Email                | Password       |
|-------|----------------------|----------------|
| Admin | `admin@richbayy.com` | `Admin@12345`  |
| User  | `demo@richbayy.com`  | `Demo@12345`   |

Try coupon **`WELCOME10`** at the cart. Track order **`RB1001`** after placing one.

---

## 🔌 API Overview

Base URL: `/api`

| Resource   | Routes |
|------------|--------|
| Auth       | `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`, `PUT /auth/password`, `POST /auth/forgot-password`, `/auth/reset-password/:token` |
| Products   | `GET /products` (filter/sort/paginate), `/products/facets`, `/products/:slug`, `/products/:id/related`, admin `POST/PUT/DELETE` |
| Categories | `GET /categories`, `/categories/:slug`, admin CRUD |
| Cart       | `GET/POST/DELETE /cart`, `PUT/DELETE /cart/:lineId`, `POST /cart/merge` |
| Wishlist   | `GET /wishlist`, `POST/DELETE /wishlist/:productId` |
| Orders     | `POST /orders`, `GET /orders/mine`, `/orders/:id`, `GET /orders/track/:orderNumber`, `PUT /orders/:id/cancel` |
| Reviews    | `GET /reviews/:productId`, `POST /reviews/:productId`, `DELETE /reviews/:id` |
| Coupons    | `POST /coupons/apply`, admin CRUD |
| Users      | `PUT /users/profile`, address book CRUD |
| Upload     | admin `POST /upload`, `DELETE /upload/:fileId` (ImageKit) |
| Admin      | `GET /admin/dashboard`, `/admin/orders`, `PUT /admin/orders/:id/status`, `/admin/customers`, `/admin/sales-report` |

---

## ☁️ Deployment

**Backend → Render**
1. Push this repo to GitHub.
2. On Render, create a **Blueprint** from `render.yaml` (or a Web Service with root `server`, build `npm install`, start `npm start`).
3. Set env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), and `IMAGEKIT_*`.
4. Run the seed once from the Render shell: `npm run seed`.

**Frontend → Vercel**
1. Import the repo, set **Root Directory** to `client`.
2. Env var: `VITE_API_URL=https://<your-render-app>.onrender.com/api`.
3. `vercel.json` already handles SPA routing. Deploy.

> Cross-site cookies: in production the API sets `SameSite=None; Secure` cookies, so both apps must be served over HTTPS (Vercel + Render both are), and `CLIENT_URL` must match the Vercel origin for CORS.

---

## 📁 Project Structure (abridged)

```
client/src
├── components/  (common, layout, product)   reusable UI + icons
├── context/     Auth, Cart, Wishlist         global state
├── hooks/       useScrollReveal, useSEO
├── layouts/     Main, Account, Admin
├── pages/       storefront + account/ + admin/
├── services/    api (axios) + endpoints
└── utils/       format, constants

server
├── config/      db, imagekit
├── controllers/ auth, product, category, cart, wishlist, order, review, coupon, banner, upload, admin
├── middleware/  auth, admin, validate, rateLimiter, upload, errorHandler, asyncHandler
├── models/      User, Product, Category, Order, Review, Coupon, Banner
├── routes/      one per resource
└── utils/       generateToken, slugify, seed(+data)
```

Built with care — *Elevated shirts. Everyday style.* 🖤
