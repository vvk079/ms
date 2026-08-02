// config/validateEnv.js
// Boot-time environment validation. Missing or weak secrets fail the process
// immediately (with a clear message) rather than surfacing as opaque 500s on the
// first authenticated request in production.
import { isSmsEnabled } from '../utils/sms.js';
import { isFirebaseEnabled } from './firebaseAdmin.js';

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];

export default function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const missing = REQUIRED.filter((k) => !process.env[k]);

  if (missing.length) {
    console.error(`❌  Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // A short/guessable JWT secret undermines every token. Enforce a real one in prod.
  if (process.env.JWT_SECRET.length < 32) {
    const msg = 'JWT_SECRET should be at least 32 characters for a secure signature.';
    if (isProd) {
      console.error(`❌  ${msg}`);
      process.exit(1);
    } else {
      console.warn(`⚠️   ${msg} (allowed in development only)`);
    }
  }

  // A phone number is the only way customers sign in, so production needs ONE
  // working delivery path — Firebase (preferred) or a direct SMS gateway.
  // Without either, codes would only reach the server console and nobody could
  // enter the store. Fail fast, with an explicit escape hatch.
  if (isProd && !isFirebaseEnabled() && !isSmsEnabled() && (process.env.SMS_PROVIDER || '').toLowerCase() !== 'console') {
    console.error(
      '❌  No phone sign-in provider configured — customers could not sign in.\n' +
      '    Either set the Firebase service account (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,\n' +
      '    FIREBASE_PRIVATE_KEY), or set SMS_PROVIDER and its keys\n' +
      '    (fast2sms | twofactor | msg91 | twilio | textbelt),\n' +
      '    or set SMS_PROVIDER=console to acknowledge running without SMS delivery.'
    );
    process.exit(1);
  }

  if (isProd && isFirebaseEnabled() && isSmsEnabled()) {
    console.warn('⚠️   Both Firebase and a direct SMS gateway are configured — the client decides which is used (Firebase when VITE_FB_API_KEY is set at build time).');
  }

  // In production, ONLINE payments must not be enabled without a gateway wired in.
  if (isProd && process.env.PAYMENTS_ENABLED === 'true') {
    console.warn('⚠️   PAYMENTS_ENABLED=true — ensure a real payment gateway is verified before creating paid orders.');
  }
}
