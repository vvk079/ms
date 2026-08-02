// main.jsx — React 19 root. Wraps the app in the router + global providers +
// the toast portal. Providers are ordered so Cart/Wishlist can read Auth.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
            {/* Global toast portal, styled to match the brand (ink on paper). */}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '14px',
                  borderRadius: '8px',
                  background: '#111',
                  color: '#fff',
                },
                success: { iconTheme: { primary: '#c9932f', secondary: '#fff' } },
              }}
            />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
