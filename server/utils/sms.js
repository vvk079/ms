// utils/sms.js
// Provider-agnostic OTP delivery. RICHBAYY always GENERATES and VERIFIES the code
// itself (hashed, in the Otp collection) — a provider is only a delivery pipe, so
// switching gateways never changes the security model.
//
// Pick a gateway with SMS_PROVIDER, or leave it blank and the first provider whose
// credentials are present wins. With nothing configured we log the code to the
// server console, so the whole flow stays testable at zero cost in development.
//
//   SMS_PROVIDER=console   → log to server console (default in dev)
//   SMS_PROVIDER=fast2sms  → FAST2SMS_API_KEY                      (India)
//   SMS_PROVIDER=twofactor → TWOFACTOR_API_KEY [+ TWOFACTOR_TEMPLATE]   (India)
//   SMS_PROVIDER=msg91     → MSG91_AUTH_KEY, MSG91_TEMPLATE_ID     (India)
//   SMS_PROVIDER=twilio    → TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
//   SMS_PROVIDER=textbelt  → TEXTBELT_KEY ('textbelt' = 1 free SMS/day, testing)
//
// To add another gateway: write one `async ({ to, code, body }) => {}` function
// and add it to the DRIVERS map. Nothing else in the app changes.

const env = (k) => (process.env[k] || '').trim();

// Which driver has its credentials filled in? Order = preference when SMS_PROVIDER
// is not set explicitly.
const configured = {
  fast2sms: () => Boolean(env('FAST2SMS_API_KEY')),
  twofactor: () => Boolean(env('TWOFACTOR_API_KEY')),
  msg91: () => Boolean(env('MSG91_AUTH_KEY') && env('MSG91_TEMPLATE_ID')),
  twilio: () => Boolean(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN') && env('TWILIO_FROM')),
  textbelt: () => Boolean(env('TEXTBELT_KEY')),
};

/** The provider we'll actually use — explicit setting first, else auto-detect. */
export function smsProvider() {
  const explicit = env('SMS_PROVIDER').toLowerCase();
  if (explicit && explicit !== 'auto') return explicit;
  return Object.keys(configured).find((name) => configured[name]()) || 'console';
}

/** True when texts will really be delivered (i.e. not the console fallback). */
export const isSmsEnabled = () => {
  const p = smsProvider();
  return p !== 'console' && Boolean(configured[p]?.());
};

// ── Drivers ──────────────────────────────────────────────────────────────────
// Each receives { to (E.164, e.g. +919876543210), code (6 digits), body (text) }.

// Fast2SMS — OTP route. Indian numbers only; expects a bare 10-digit number.
async function fast2sms({ to, code }) {
  const numbers = to.replace(/\D/g, '').slice(-10);
  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(env('FAST2SMS_API_KEY'))}` +
    `&route=otp&variables_values=${encodeURIComponent(code)}&numbers=${numbers}&flash=0`;
  const r = await fetch(url, { method: 'GET' });
  const text = await r.text();
  if (!r.ok || /"return"\s*:\s*false/.test(text)) throw new Error(`Fast2SMS error (${r.status}): ${text.slice(0, 200)}`);
  return { delivered: true, provider: 'fast2sms' };
}

// 2Factor.in — path-style API; the template is your DLT-approved sender template.
async function twofactor({ to, code }) {
  const key = env('TWOFACTOR_API_KEY');
  const tpl = env('TWOFACTOR_TEMPLATE');
  const phone = to.replace(/\D/g, '').slice(-10);
  const url = `https://2factor.in/API/V1/${key}/SMS/${phone}/${code}` + (tpl ? `/${encodeURIComponent(tpl)}` : '');
  const r = await fetch(url);
  const text = await r.text();
  if (!r.ok || /"Status"\s*:\s*"Error"/i.test(text)) throw new Error(`2Factor error (${r.status}): ${text.slice(0, 200)}`);
  return { delivered: true, provider: 'twofactor' };
}

// MSG91 — OTP endpoint, sending OUR code (so verification stays in our DB).
async function msg91({ to, code }) {
  const params = new URLSearchParams({
    template_id: env('MSG91_TEMPLATE_ID'),
    mobile: to.replace(/\D/g, ''),   // country code + number, no '+'
    otp: String(code),
    otp_expiry: '5',
  });
  if (env('MSG91_SENDER_ID')) params.set('sender', env('MSG91_SENDER_ID'));

  const r = await fetch(`https://control.msg91.com/api/v5/otp?${params.toString()}`, {
    method: 'POST',
    headers: { authkey: env('MSG91_AUTH_KEY'), 'Content-Type': 'application/json' },
  });
  const text = await r.text();
  if (!r.ok || /"type"\s*:\s*"error"/i.test(text)) throw new Error(`MSG91 error (${r.status}): ${text.slice(0, 200)}`);
  return { delivered: true, provider: 'msg91' };
}

// Twilio — plain REST call, no SDK dependency.
async function twilio({ to, body }) {
  const sid = env('TWILIO_ACCOUNT_SID');
  const token = env('TWILIO_AUTH_TOKEN');
  const params = new URLSearchParams({ To: to, From: env('TWILIO_FROM'), Body: body });
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!r.ok) throw new Error(`Twilio error (${r.status}): ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return { delivered: true, provider: 'twilio' };
}

// Textbelt — handy for a smoke test (key 'textbelt' = one free SMS per day).
async function textbelt({ to, body }) {
  const r = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: to, message: body, key: env('TEXTBELT_KEY') }),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.success) throw new Error(`Textbelt error: ${data.error || r.status}`);
  return { delivered: true, provider: 'textbelt' };
}

async function consoleDriver({ to, body }) {
  console.log(`\n📱  [SMS not configured — dev fallback] → ${to}\n     ${body}\n`);
  return { delivered: false, provider: 'console' };
}

const DRIVERS = { fast2sms, twofactor, msg91, twilio, textbelt, console: consoleDriver };

/**
 * Deliver an OTP. Never throws for a missing/unknown config — falls back to the
 * console so development is never blocked on a gateway account.
 */
export async function sendSms({ to, code, body }) {
  const provider = smsProvider();
  const driver = DRIVERS[provider];

  if (!driver || !isSmsEnabled()) {
    if (provider !== 'console') console.warn(`⚠️   SMS_PROVIDER="${provider}" is not fully configured — falling back to console.`);
    return consoleDriver({ to, body });
  }
  return driver({ to, code, body });
}
