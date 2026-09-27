import { ShieldCheck, ShieldOff } from 'lucide-react';

export default function ProtectionCard({ rules, decisionCounts, className = '' }) {
  const enabledCount = rules.filter((r) => r.enabled).length;
  const isProtected = enabledCount > 0;

  return (
    <section
      aria-labelledby="protection-title"
      className={`relative flex flex-col justify-between gap-8 overflow-hidden rounded-[32px] bg-ink p-7 text-paper sm:p-8 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="protection-title" className="text-xs font-bold uppercase tracking-[0.18em] text-paper/60">
            Protection status
          </h2>
          <p className="mt-3 font-display text-7xl font-extrabold leading-[0.85] tracking-tight sm:text-8xl">
            {isProtected ? 'ON' : 'OFF'}
            <span className={isProtected ? 'text-lime' : 'text-coral'}>.</span>
          </p>
          <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-paper/70">
            {isProtected
              ? 'Every checkout gets checked against your rules before payment.'
              : 'All rules are paused. Turn one on to start checking checkouts.'}
          </p>
        </div>
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          {isProtected && <span className="absolute inset-0 animate-ping rounded-full bg-lime/40" aria-hidden="true" />}
          <span className={`relative flex h-16 w-16 items-center justify-center rounded-full ${isProtected ? 'bg-lime' : 'bg-coral'} text-ink`}>
            {isProtected ? <ShieldCheck className="h-8 w-8" aria-hidden="true" /> : <ShieldOff className="h-8 w-8" aria-hidden="true" />}
          </span>
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-bold">Rules armed</span>
          <span className="font-display text-xl font-extrabold tabular-nums">
            {enabledCount}
            <span className="text-paper/40">/{rules.length}</span>
          </span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {rules.map((r) => (
            <span
              key={r.id}
              title={r.name}
              className={`h-2.5 flex-1 rounded-full transition-colors duration-500 ${r.enabled ? 'bg-lime' : 'bg-paper/15'}`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-paper/60">In your audit trail</p>
        <dl className="grid grid-cols-3 gap-2">
          {[
            { key: 'ALLOW', bg: 'bg-lime' },
            { key: 'WARN', bg: 'bg-sun' },
            { key: 'BLOCK', bg: 'bg-coral' },
          ].map(({ key, bg }) => (
            <div key={key} className="rounded-2xl bg-paper/[0.06] p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-paper/70">
                <span className={`h-2 w-2 rounded-full ${bg}`} aria-hidden="true" />
                {key}
              </dt>
              <dd className="mt-1 font-display text-3xl font-extrabold tabular-nums">{decisionCounts[key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
