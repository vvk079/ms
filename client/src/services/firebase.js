// services/firebase.js
// Firebase Phone Auth, loaded lazily.
//
// Firebase sends the SMS and verifies the code in the browser. All we get back
// is a signed ID token, which we hand to our own API (`/auth/firebase`) — the
// server verifies the signature and mints the normal RICHBAYY session cookie.
// The Firebase session itself is thrown away immediately afterwards; our cookie
// remains the single source of truth for "who is signed in".
//
// The SDK is imported dynamically so its ~100 KB only downloads when someone
// actually opens the sign-in page.
//
// Config comes from VITE_FB_* build-time env vars. These keys are public by
// design (lock them down with an HTTP-referrer restriction in the Google Cloud
// console); the private service-account key lives only on the server.
// With no VITE_FB_API_KEY set, the app falls back to the in-house OTP flow.

import { authApi } from './endpoints.js';

/** Firebase keys present in this build? (Necessary, but not sufficient — see resolveAuthMode.) */
export const hasFirebaseConfig = Boolean(import.meta.env.VITE_FB_API_KEY);

const CONFIG = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

let sdkPromise = null;
let verifier = null;
let modePromise = null;

/**
 * Decide which verification path to drive: 'firebase' or 'otp'.
 *
 * Firebase is used only when this build has the keys AND the API can verify the
 * resulting token. Sending a Firebase SMS that our server can't accept would
 * strand the customer at the last step, so anything uncertain falls back to the
 * in-house OTP, which always works.
 */
export function resolveAuthMode() {
  if (!hasFirebaseConfig) return Promise.resolve('otp');
  if (!modePromise) {
    modePromise = authApi.providers()
      .then((p) => (p?.firebase ? 'firebase' : 'otp'))
      .catch(() => 'otp');
  }
  return modePromise;
}

/** Load + initialise the SDK once, then reuse it. */
function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const [{ initializeApp, getApps, getApp }, auth] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);

      const app = getApps().length ? getApp() : initializeApp(CONFIG);
      const instance = auth.getAuth(app);
      // Our cookie is the real session — don't leave a Firebase one in storage.
      await auth.setPersistence(instance, auth.inMemoryPersistence).catch(() => {});
      return { ...auth, auth: instance };
    })();
  }
  return sdkPromise;
}

/**
 * Warm the SDK chunk in the background (call when the sign-in page opens) so the
 * download happens while the customer is typing rather than after they tap Send.
 */
export function preloadFirebase() {
  resolveAuthMode().then((mode) => { if (mode === 'firebase') loadSdk().catch(() => {}); });
}

/** Tear down the invisible reCAPTCHA widget (a used one can't be re-submitted). */
export function clearVerifier() {
  try { verifier?.clear(); } catch { /* already gone */ }
  verifier = null;
}

/**
 * Send a verification code. Returns a `confirmation` object — hold onto it and
 * pass it to confirmCode() with whatever the customer types.
 * @param {string} phoneE164 e.g. '+919876543210'
 * @param {string} containerId id of an element that exists in the DOM
 */
export async function sendVerificationCode(phoneE164, containerId = 'recaptcha-container') {
  const sdk = await loadSdk();

  // A fresh widget per send: reusing a solved reCAPTCHA fails on resend.
  clearVerifier();
  verifier = new sdk.RecaptchaVerifier(sdk.auth, containerId, { size: 'invisible' });

  try {
    return await sdk.signInWithPhoneNumber(sdk.auth, phoneE164, verifier);
  } catch (err) {
    clearVerifier();
    throw err;
  }
}

/**
 * Confirm the typed code and return a fresh Firebase ID token for our API.
 * The Firebase session is signed out straight away — we only ever needed proof
 * that this browser controls the phone number.
 */
export async function confirmCode(confirmation, code) {
  const credential = await confirmation.confirm(code);
  const idToken = await credential.user.getIdToken();

  const sdk = await loadSdk();
  await sdk.signOut(sdk.auth).catch(() => {});
  clearVerifier();

  return idToken;
}

/** Turn Firebase's error codes into something a shopper can act on. */
export function firebaseAuthMessage(err) {
  switch (err?.code) {
    case 'auth/invalid-phone-number':
      return 'That phone number doesn’t look right. Please check and try again.';
    case 'auth/missing-phone-number':
      return 'Please enter your mobile number.';
    case 'auth/invalid-verification-code':
      return 'Incorrect code. Please check the SMS and try again.';
    case 'auth/code-expired':
      return 'That code has expired. Please request a new one.';
    case 'auth/too-many-requests':
      return 'Too many attempts from this device. Please wait a few minutes and try again.';
    case 'auth/quota-exceeded':
      return 'We’re unable to send codes right now. Please try again shortly.';
    case 'auth/captcha-check-failed':
    case 'auth/missing-app-credential':
      return 'Security check failed. Please refresh the page and try again.';
    case 'auth/network-request-failed':
      return 'Network problem — check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in isn’t enabled for this site yet.';
    default:
      return err?.message || 'Something went wrong. Please try again.';
  }
}
