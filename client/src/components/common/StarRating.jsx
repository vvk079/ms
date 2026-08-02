// components/common/StarRating.jsx
// Renders 5 stars, optionally interactive (for the review form). Non-interactive
// mode just shows filled/empty stars for a given rating.
import { useState } from 'react';

const Star = ({ filled, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#e8b33a' : '#e2e0da'}>
    <path d="M12 2l2.9 6.2 6.8.6-5.1 4.5 1.5 6.6L12 17l-6 3.4 1.5-6.6L2.4 8.8l6.8-.6z" />
  </svg>
);

export default function StarRating({ value = 0, size = 15, editable = false, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <span className="inline-flex gap-0.5 leading-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={editable ? 'cursor-pointer' : ''}
          onMouseEnter={editable ? () => setHover(i) : undefined}
          onMouseLeave={editable ? () => setHover(0) : undefined}
          onClick={editable ? () => onChange?.(i) : undefined}
        >
          <Star filled={i <= shown} size={size} />
        </span>
      ))}
    </span>
  );
}
