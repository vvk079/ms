// config/firebaseAdmin.js
// Firebase Admin, initialised lazily so the server boots fine without Firebase
// credentials (the phone-OTP fallback in utils/sms.js still works in that case).
//
// Credentials come from a service-account key:
//   Firebase console → Project settings → Service accounts → Generate new private key
// Only three fields from that JSON are needed; keep them in .env, never in git.
//
// NB: use the modular subpath imports ('firebase-admin/app', 'firebase-admin/auth').
// The default `import admin from 'firebase-admin'` does NOT expose `.credential`
// under ESM in v13+, which fails only at request time — not at boot.
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/** True when a service account is configured (i.e. Firebase auth is usable). */
export const isFirebaseEnabled = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );

let app = null;

/** Get (and on first call, create) the Admin app. Throws if not configured. */
export function firebaseApp() {
  if (app) return app;
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase is not configured on this server');
  }

  app = getApps().length ? getApp() : initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Hosting dashboards (Render, Vercel) store the key with literal "\n"
      // sequences rather than real newlines — normalise both forms.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  console.log('🔥  Firebase Admin initialised — phone auth via Firebase.');
  return app;
}

/**
 * Verify a Firebase ID token minted by a phone sign-in.
 * Returns the E.164 phone number Firebase itself verified — never trust a phone
 * number sent alongside the token by the client.
 */
export async function verifyPhoneIdToken(idToken) {
  const decoded = await getAuth(firebaseApp()).verifyIdToken(String(idToken || ''));

  // The token must come from an actual SMS verification, not (say) an anonymous
  // or email sign-in enabled later on the same Firebase project.
  if (decoded.firebase?.sign_in_provider !== 'phone' || !decoded.phone_number) {
    const err = new Error('Phone verification required');
    err.status = 401;
    throw err;
  }

  // ID tokens live an hour. For a *login* endpoint we want proof the customer
  // verified their number just now, so a leaked token can't be replayed later.
  const authAgeSec = Date.now() / 1000 - Number(decoded.auth_time || 0);
  if (!Number.isFinite(authAgeSec) || authAgeSec > 10 * 60) {
    const err = new Error('Your verification expired. Please request a new code.');
    err.status = 401;
    throw err;
  }

  return decoded.phone_number;
}
