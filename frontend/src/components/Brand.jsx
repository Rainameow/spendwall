import { Shield } from 'lucide-react';

export function BrandMark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-ink bg-lime shadow-pop transition-transform duration-300 group-hover:-rotate-6">
        <Shield className="h-5 w-5 fill-ink text-ink" aria-hidden="true" />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
        spendwall<span className="text-coral">.</span>
      </span>
    </span>
  );
}
