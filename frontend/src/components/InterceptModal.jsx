import { X, ShieldX, ShieldCheck, Sliders, ArrowRight, ShoppingBag } from 'lucide-react';
import { DecisionStamp } from './Decision.jsx';
import { DECISIONS, decisionFromSeverity } from './decisions.js';

export default function InterceptModal({ sim, onBlock, onOverride, onModify, onClose }) {
  const decision = decisionFromSeverity(sim.severity);
  const changedCount = sim.diffs.filter((d) => d.changed).length;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade items-center justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intercept-title"
    >
      <div className="my-auto w-full max-w-2xl animate-rise overflow-hidden rounded-[32px] border-2 border-ink bg-white shadow-pop-lg">
        <div className={`relative flex flex-col gap-5 px-6 pb-6 pt-6 sm:flex-row sm:items-end sm:justify-between ${DECISIONS[decision].soft}`}>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/70">Checkout paused by Spendwall</p>
            <h2 id="intercept-title" className="font-display text-3xl font-extrabold leading-[0.95] tracking-tight text-ink text-balance sm:text-4xl">
              {sim.violation}
            </h2>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="font-bold text-ink">{sim.item}</span>
              <span aria-hidden="true">·</span>
              <span>{sim.merchant}</span>
              <span aria-hidden="true">·</span>
              <span>via {sim.agent}</span>
            </p>
          </div>
          <DecisionStamp decision={decision} className="self-start sm:self-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full border-2 border-ink bg-white p-1.5 text-ink transition hover:rotate-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="leading-relaxed text-ink/80">{sim.description}</p>

          <section aria-labelledby="truecost-title" className="rounded-3xl border-2 border-ink/10 bg-paper p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id="truecost-title" className="font-display text-xl font-extrabold tracking-tight text-ink">
                TrueCost<span className="text-coral">.</span>
              </h3>
              <span className="text-xs font-bold text-muted">
                {changedCount} {changedCount === 1 ? 'change' : 'changes'} at checkout
              </span>
            </div>
            <div className="mb-2 hidden grid-cols-[1fr_1fr_auto_1fr] gap-3 px-3 text-[11px] font-bold uppercase tracking-wider text-muted sm:grid">
              <span>Item</span>
              <span>Expected</span>
              <span className="w-4" />
              <span>At checkout</span>
            </div>
            <ul className="space-y-2">
              {sim.diffs.map((diff, idx) => (
                <li
                  key={idx}
                  className={`grid grid-cols-1 gap-1 rounded-2xl px-3 py-2.5 text-sm sm:grid-cols-[1fr_1fr_auto_1fr] sm:items-center sm:gap-3 ${
                    diff.changed ? 'border-2 border-coral bg-white' : 'bg-white/60'
                  }`}
                >
                  <span className="font-bold text-ink">{diff.label}</span>
                  <span className={diff.changed ? 'text-muted line-through' : 'text-muted'}>{diff.original}</span>
                  <ArrowRight className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
                  <span className={diff.changed ? 'font-bold text-coral' : 'font-medium text-ink'}>{diff.final}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onBlock(sim)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral px-5 py-3 font-bold text-ink shadow-pop transition hover:-translate-y-0.5 hover:shadow-pop-lg"
            >
              <ShieldX className="h-4 w-4" aria-hidden="true" />
              Block purchase
            </button>
            <button
              type="button"
              onClick={() => onOverride(sim)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 py-3 font-bold text-ink transition hover:bg-sun"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Override &amp; proceed
            </button>
            <button
              type="button"
              onClick={onModify}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-3 font-bold text-ink underline decoration-2 underline-offset-4 transition hover:decoration-lime"
            >
              <Sliders className="h-4 w-4" aria-hidden="true" />
              Edit rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
