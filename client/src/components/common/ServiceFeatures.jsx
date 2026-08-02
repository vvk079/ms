// components/common/ServiceFeatures.jsx
// The "Free Shipping / Easy Returns / Secure Payments / Support" strip reused on
// Home, PDP, Cart and Profile in the template.
import { FeatureIcon } from './Icons.jsx';
import { SERVICE_FEATURES } from '../../utils/constants.js';

export default function ServiceFeatures({ className = '' }) {
  return (
    <div className={`flex flex-wrap gap-y-5 rounded-lg bg-sand px-5 py-5 sm:flex-nowrap ${className}`}>
      {SERVICE_FEATURES.map((f, i) => (
        <div
          key={f.key}
          className={`flex flex-1 basis-1/2 items-center gap-3 px-3 sm:basis-auto sm:px-6 ${i > 0 ? 'sm:border-l sm:border-[#e2e0da]' : ''}`}
        >
          <span className="shrink-0 text-ink"><FeatureIcon name={f.key === 'ship' ? 'ship' : f.key === 'returns' ? 'returns' : f.key === 'secure' ? 'secure' : 'support'} size={22} /></span>
          <div>
            <div className="text-[13px] font-semibold">{f.title}</div>
            <div className="text-[12px] text-[#777]">{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
