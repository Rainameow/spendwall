import { Trash2, Lock, DollarSign } from 'lucide-react';

export default function RuleCard({ rule, index, onToggle, onUpdateLimit, onDelete }) {
  const TypeIcon = rule.type === 'limit' ? DollarSign : Lock;

  return (
    <li
      className={`group relative flex flex-col gap-4 rounded-[28px] border-2 p-5 transition duration-300 sm:flex-row sm:items-center sm:p-6 ${
        rule.enabled
          ? 'border-ink bg-white shadow-card hover:-translate-y-0.5 hover:shadow-pop-lg'
          : 'border-dashed border-ink/25 bg-paper-deep/50'
      }`}
    >
      <div className="flex flex-1 items-start gap-4">
        <span
          className={`font-display text-3xl font-extrabold leading-none tabular-nums transition-colors sm:text-4xl ${
            rule.enabled ? 'text-ink' : 'text-ink/25'
          }`}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-display text-lg font-bold leading-tight ${rule.enabled ? 'text-ink' : 'text-ink/50'}`}>
              {rule.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[11px] font-medium text-muted">
              <TypeIcon className="h-3 w-3" aria-hidden="true" />
              {rule.type === 'limit' ? 'Dollar limit' : 'On/off block'}
            </span>
            {rule.custom && (
              <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-bold text-coral">Custom</span>
            )}
          </div>
          <p className={`text-sm leading-relaxed ${rule.enabled ? 'text-muted' : 'text-muted/70'}`}>{rule.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-12 sm:pl-0">
        {rule.type === 'limit' && rule.enabled && (
          <label className="flex items-center gap-1 rounded-2xl border-2 border-ink/10 bg-paper px-3 py-2 transition focus-within:border-ink">
            <span className="font-display text-lg font-bold text-ink">$</span>
            <span className="sr-only">Limit amount for {rule.name}</span>
            <input
              type="number"
              value={rule.value}
              onChange={(e) => onUpdateLimit(rule.id, e.target.value)}
              className="w-16 bg-transparent font-display text-lg font-bold tabular-nums text-ink focus:outline-none"
            />
          </label>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={rule.enabled}
          aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
          onClick={() => onToggle(rule.id)}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-ink transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/60 ${
            rule.enabled ? 'bg-lime' : 'bg-white'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-ink transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1.3)] ${
              rule.enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>

        {rule.custom && (
          <button
            type="button"
            onClick={() => onDelete(rule.id)}
            aria-label={`Delete custom rule ${rule.name}`}
            className="rounded-xl p-2 text-muted transition hover:bg-coral/15 hover:text-coral"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
