import { DECISIONS } from './decisions.js';

export function DecisionChip({ decision, className = '' }) {
  const d = DECISIONS[decision];
  const Icon = d.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-1 font-display text-[11px] font-extrabold tracking-wider ${d.chip} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {d.label}
    </span>
  );
}

export function DecisionStamp({ decision, className = '' }) {
  const d = DECISIONS[decision];
  return (
    <div
      className={`inline-flex animate-pop items-center rounded-2xl border-2 border-ink px-5 py-2 font-display text-5xl font-extrabold leading-none tracking-tight shadow-pop-lg sm:text-6xl ${d.chip} ${className}`}
      role="status"
    >
      {d.label}
    </div>
  );
}
