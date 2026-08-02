// utils/slugify.js
// Minimal, dependency-free slug generator (lowercase, hyphenated, url-safe).
const slugify = (str = '') =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')  // non-alphanumerics → single hyphen
    .replace(/^-+|-+$/g, '');     // trim leading/trailing hyphens

export default slugify;
