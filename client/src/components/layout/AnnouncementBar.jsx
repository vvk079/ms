// components/layout/AnnouncementBar.jsx
// The thin black promo bar at the very top (template: "Free shipping…").
import { ANNOUNCEMENT } from '../../utils/constants.js';

export default function AnnouncementBar() {
  return (
    <div className="bg-ink px-4 py-[9px] text-center text-[13px] font-normal tracking-[0.3px] text-white">
      {ANNOUNCEMENT}
    </div>
  );
}
