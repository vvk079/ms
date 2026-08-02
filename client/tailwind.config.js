/** tailwind.config.js
 * RICHBAYY design tokens lifted directly from the approved template:
 * ink #111 · paper #fff · sand/mist neutrals · gold accent · Jost typeface.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',        // primary black (text, buttons)
        paper: '#ffffff',      // background
        sand: '#f7f6f3',       // warm section bg (feature strip, cards)
        mist: '#f2f1ef',       // category section bg
        stone: '#ececec',      // hairline borders
        gold: '#c9932f',       // accent / "best seller" badge
        star: '#e8b33a',       // rating stars
        success: '#2e8b57',
        muted: '#666666',
      },
      fontFamily: {
        // Jost is the brand face; Helvetica/Arial fallbacks match the template.
        sans: ['Jost', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        brand: '1.5px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
        soft: '0 1px 4px rgba(0,0,0,0.12)',
        lift: '0 18px 34px rgba(0,0,0,0.16)',
        btn: '0 10px 24px rgba(0,0,0,0.18)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.22,.61,.36,1)',
        reveal: 'cubic-bezier(.76,0,.24,1)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(18px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        fadeUp: 'fadeUp .6s cubic-bezier(.22,.61,.36,1) both',
      },
    },
  },
  plugins: [],
};
