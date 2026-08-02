// context/AuthContext.jsx
// Holds the authenticated user and exposes the OTP flow + logout. On mount it
// asks the server "who am I?" using the HTTP-only cookie, so a refresh keeps the
// session. Auth state changes broadcast so the cart/wishlist can re-sync.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/endpoints.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first /me resolves

  // Restore session on first load.
  useEffect(() => {
    (async () => {
      try {
        const { user } = await authApi.me();
        setUser(user);
      } catch {
        setUser(null); // no/invalid cookie — guest
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (creds) => {
    const { user } = await authApi.login(creds);
    setUser(user);
    return user;
  }, []);

  // Phone OTP — the customer sign-in AND sign-up path: request a code, then
  // verify it. Verifying sets the session cookie and, for a number we've never
  // seen, creates the account (`isNew` tells the UI to collect a name).
  const requestOtp = useCallback((data) => authApi.requestOtp(data), []);
  const verifyOtp = useCallback(async (data) => {
    const { user, isNew } = await authApi.verifyOtp(data);
    setUser(user);
    return { user, isNew };
  }, []);

  // Firebase path: Firebase already verified the SMS in the browser — trade its
  // signed ID token for our own session cookie.
  const firebaseLogin = useCallback(async (idToken) => {
    const { user, isNew } = await authApi.firebaseLogin(idToken);
    setUser(user);
    return { user, isNew };
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  // Allow other flows (profile edit) to patch the cached user.
  const patchUser = useCallback((partial) => setUser((u) => ({ ...u, ...partial })), []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,      // staff/admin only (email + password)
    requestOtp,
    verifyOtp,
    firebaseLogin,
    logout,
    patchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
