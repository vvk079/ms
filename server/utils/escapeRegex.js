// utils/escapeRegex.js
// Escapes regex metacharacters in user-supplied strings before they are compiled
// into a RegExp, preventing ReDoS / unintended-match injection on search filters.
export default function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
