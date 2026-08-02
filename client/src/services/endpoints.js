// services/endpoints.js
// Thin, typed-ish wrappers around the REST API grouped by resource. Keeps axios
// calls out of components and gives one place to tweak paths.
import api from './api.js';

export const authApi = {
  // Customers: phone + OTP (requestOtp/verifyOtp). `login` is staff-only.
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (data) => api.put('/auth/password', data).then((r) => r.data),
  forgot: (data) => api.post('/auth/forgot-password', data).then((r) => r.data),
  reset: (token, data) => api.post(`/auth/reset-password/${token}`, data).then((r) => r.data),
  // Which phone-verification path the API can complete (firebase vs in-house OTP).
  providers: () => api.get('/auth/providers').then((r) => r.data),
  // Firebase phone auth: exchange a verified Firebase ID token for our session.
  firebaseLogin: (idToken) => api.post('/auth/firebase', { idToken }).then((r) => r.data),
  // In-house OTP fallback (used when Firebase keys aren't configured).
  requestOtp: (data) => api.post('/auth/otp/request', data).then((r) => r.data),
  verifyOtp: (data) => api.post('/auth/otp/verify', data).then((r) => r.data),
};

export const productApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  facets: () => api.get('/products/facets').then((r) => r.data),
  get: (slug) => api.get(`/products/${slug}`).then((r) => r.data),
  related: (id) => api.get(`/products/${id}/related`).then((r) => r.data),
  create: (data) => api.post('/products', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const categoryApi = {
  list: () => api.get('/categories').then((r) => r.data),
  get: (slug) => api.get(`/categories/${slug}`).then((r) => r.data),
  create: (data) => api.post('/categories', data).then((r) => r.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const cartApi = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (data) => api.post('/cart', data).then((r) => r.data),
  merge: (items) => api.post('/cart/merge', { items }).then((r) => r.data),
  update: (lineId, qty) => api.put(`/cart/${lineId}`, { qty }).then((r) => r.data),
  remove: (lineId) => api.delete(`/cart/${lineId}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
};

export const wishlistApi = {
  get: () => api.get('/wishlist').then((r) => r.data),
  toggle: (productId) => api.post(`/wishlist/${productId}`).then((r) => r.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
};

export const orderApi = {
  create: (data) => api.post('/orders', data).then((r) => r.data),
  mine: () => api.get('/orders/mine').then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  // `contact` = the phone number (or email) on the account that placed the order.
  track: (num, contact) => api.get(`/orders/track/${num}`, { params: { contact } }).then((r) => r.data),
  cancel: (id) => api.put(`/orders/${id}/cancel`).then((r) => r.data),
};

export const reviewApi = {
  list: (productId) => api.get(`/reviews/${productId}`).then((r) => r.data),
  create: (productId, data) => api.post(`/reviews/${productId}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
};

export const couponApi = {
  apply: (code, subtotal) => api.post('/coupons/apply', { code, subtotal }).then((r) => r.data),
  list: () => api.get('/coupons').then((r) => r.data),
  create: (data) => api.post('/coupons', data).then((r) => r.data),
  update: (id, data) => api.put(`/coupons/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/coupons/${id}`).then((r) => r.data),
};

export const bannerApi = {
  list: (position) => api.get('/banners', { params: { position } }).then((r) => r.data),
};

export const userApi = {
  updateProfile: (data) => api.put('/users/profile', data).then((r) => r.data),
  addresses: () => api.get('/users/addresses').then((r) => r.data),
  addAddress: (data) => api.post('/users/addresses', data).then((r) => r.data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`).then((r) => r.data),
};

export const uploadApi = {
  images: (formData, folder) =>
    api.post('/upload', formData, { params: { folder }, headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  orders: (params) => api.get('/admin/orders', { params }).then((r) => r.data),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data).then((r) => r.data),
  customers: (params) => api.get('/admin/customers', { params }).then((r) => r.data),
  salesReport: (days) => api.get('/admin/sales-report', { params: { days } }).then((r) => r.data),
};
