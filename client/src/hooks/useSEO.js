// hooks/useSEO.js
// Lightweight per-page SEO without extra deps: sets document.title and the
// meta description / OG tags on mount. Keeps the app SEO-friendly for crawlers
// that execute JS (and pairs well with prerendering on Vercel).
import { useEffect } from 'react';
import { BRAND } from '../utils/constants.js';

export default function useSEO({ title, description, image } = {}) {
  useEffect(() => {
    if (title) document.title = `${title} · ${BRAND}`;

    const setMeta = (selector, attr, value) => {
      if (!value) return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [key, val] = selector.replace(/meta\[|\]/g, '').split('=');
        el.setAttribute(key, val.replace(/["']/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title ? `${title} · ${BRAND}` : null);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', image);
  }, [title, description, image]);
}
