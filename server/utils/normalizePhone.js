// utils/normalizePhone.js
// Canonicalise a phone number to a consistent identity string so the same number
// typed with/without spaces, dashes or a country code maps to one account.
// Defaults a bare 10-digit Indian number to +91. Returns null if it can't form a
// plausible E.164-ish value (7–15 digits).
export default function normalizePhone(input = '') {
  let s = String(input).trim();
  const hasPlus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;

  if (hasPlus) return `+${digits}`;
  // Bare 10-digit number → assume India (+91) to match the store's default market.
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}
