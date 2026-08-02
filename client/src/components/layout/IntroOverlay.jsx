// components/layout/IntroOverlay.jsx
// Recreates the template's brand intro: three neutral panels, the letters of
// "RICHBAYY" rising into view, an underline draw + tagline, then the panels slide
// up to reveal the site. Shown once per browser session.
import { useEffect, useState } from 'react';
import { BRAND, TAGLINE } from '../../utils/constants.js';

const PANEL_COLORS = ['#c9bfae', '#dcdad4', '#cabfb0'];
const SESSION_KEY = 'richbayy_intro_shown';

export default function IntroOverlay() {
  // step 0 → initial, 1 → letters in, 2 → panels leaving, 3 → done (unmount)
  const [step, setStep] = useState(() => (sessionStorage.getItem(SESSION_KEY) ? 3 : 0));

  // Drive the whole sequence ONCE on mount. (Depending on `step` here would
  // re-arm the early timers and bounce the animation between steps forever.)
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) { setStep(3); return; }
    const timers = [
      setTimeout(() => setStep(1), 200),   // letters rise in
      setTimeout(() => setStep(2), 1750),  // panels start sliding up
      setTimeout(() => {                    // fully done — unmount + remember
        setStep(3);
        sessionStorage.setItem(SESSION_KEY, '1');
      }, 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (step >= 3) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: step >= 2 ? 'none' : 'auto' }}
    >
      {/* Sliding panels */}
      {PANEL_COLORS.map((bg, i) => (
        <div
          key={i}
          className="absolute bottom-0 top-0"
          style={{
            left: `${(i * 100) / 3}%`,
            width: `${100 / 3 + 0.5}%`,
            background: bg,
            transform: step >= 2 ? 'translateY(-102%)' : 'translateY(0)',
            transition: 'transform 1.05s cubic-bezier(.76,0,.24,1)',
            transitionDelay: step >= 2 ? `${i * 0.12}s` : '0s',
          }}
        />
      ))}

      {/* Centre content */}
      <div
        className="absolute inset-0 z-[2] flex flex-col items-center justify-center"
        style={{
          opacity: step >= 2 ? 0 : 1,
          transform: step >= 2 ? 'translateY(-18px)' : 'translateY(0)',
          transition: 'opacity .55s ease, transform .7s cubic-bezier(.76,0,.24,1)',
        }}
      >
        {/* Wordmark with per-letter rise */}
        <div className="flex overflow-hidden text-ink" style={{ fontSize: 'clamp(34px,9vw,58px)', fontWeight: 600, letterSpacing: '8px', lineHeight: 1.15 }}>
          {BRAND.split('').map((ch, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                transform: step >= 1 ? 'translateY(0)' : 'translateY(115%)',
                opacity: step >= 1 ? 1 : 0,
                transition: 'transform .9s cubic-bezier(.22,.61,.36,1), opacity .9s ease',
                transitionDelay: `${i * 0.06}s`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Underline draw */}
        <div
          className="mt-6 h-px w-[220px] bg-ink"
          style={{
            transform: step >= 1 ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'center',
            transition: 'transform 1s cubic-bezier(.76,0,.24,1)',
            transitionDelay: '.45s',
          }}
        />

        {/* Tagline */}
        <div
          className="mt-4 text-[12px] tracking-[5px] text-[#3a3a3a]"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity .9s ease, transform .9s ease',
            transitionDelay: '.7s',
          }}
        >
          {TAGLINE}
        </div>
      </div>
    </div>
  );
}
