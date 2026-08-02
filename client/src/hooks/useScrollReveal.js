// hooks/useScrollReveal.js
// Recreates the template's scroll-reveal (fade + rise + de-blur) using an
// IntersectionObserver. Attach the returned ref to a container; any descendant
// with a `data-reveal` attribute animates in as it enters the viewport, with a
// stagger based on its order among siblings.
import { useEffect, useRef } from 'react';

export default function useScrollReveal(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll('[data-reveal]'));
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.filter = 'blur(6px)';
      el.style.transition =
        'opacity .85s cubic-bezier(.22,.61,.36,1), transform .85s cubic-bezier(.22,.61,.36,1), filter .85s cubic-bezier(.22,.61,.36,1)';
      el.style.willChange = 'opacity, transform, filter';
      const sibs = Array.from(el.parentElement.querySelectorAll(':scope > [data-reveal]'));
      el.dataset.delay = String(Math.max(0, sibs.indexOf(el)) * 90);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.filter = 'blur(0)';
          }, Number(el.dataset.delay) || 0);
          io.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
