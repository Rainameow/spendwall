import { X, Lock, DollarSign, AlertTriangle, ShieldCheck } from 'lucide-react';

const fieldClass =
  'w-full rounded-2xl border-2 border-ink/10 bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none';

export default function AddRuleModal({ ruleDraft, setRuleDraft, ruleFormError, onSubmit, onClose }) {
  const typeOptions = [
    { key: 'toggle', icon: Lock, title: 'On/off block', text: 'Blocks any match outright.' },
    { key: 'limit', icon: DollarSign, title: 'Dollar limit', text: 'Blocks when a cap is exceeded.' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-rule-title"
    >
      <div className="w-full max-w-lg animate-rise overflow-hidden rounded-[32px] border-2 border-ink bg-white shadow-pop-lg">
        <div className="flex items-start justify-between gap-4 bg-lime px-6 pb-5 pt-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/70">New firewall rule</p>
            <h2 id="add-rule-title" className="mt-1 font-display text-3xl font-extrabold leading-none tracking-tight text-ink">
              Write your own rule.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border-2 border-ink bg-white p-1.5 text-ink transition hover:rotate-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label htmlFor="rule-name" className="text-sm font-bold text-ink">Rule name</label>
            <input
              id="rule-name"
              type="text"
              value={ruleDraft.name}
              onChange={(e) => setRuleDraft({ ...ruleDraft, name: e.target.value })}
              placeholder="e.g. Block gambling merchants"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rule-desc" className="text-sm font-bold text-ink">Description</label>
            <textarea
              id="rule-desc"
              value={ruleDraft.description}
              onChange={(e) => setRuleDraft({ ...ruleDraft, description: e.target.value })}
              placeholder="What should Spendwall watch for, and what happens when it triggers?"
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-bold text-ink">Rule type</legend>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map(({ key, icon: Icon, title, text }) => {
                const selected = ruleDraft.type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setRuleDraft({ ...ruleDraft, type: key })}
                    className={`rounded-2xl border-2 p-3 text-left transition ${
                      selected ? 'border-ink bg-lime/30 shadow-pop' : 'border-ink/10 bg-paper hover:border-ink/40'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-ink">
                      <Icon className="h-4 w-4" aria-hidden="true" /> {title}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{text}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {ruleDraft.type === 'limit' && (
            <div className="space-y-1.5">
              <label htmlFor="rule-limit" className="text-sm font-bold text-ink">Limit amount</label>
              <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-paper px-4 py-3 transition focus-within:border-ink">
                <span className="font-display text-lg font-bold text-ink">$</span>
                <input
                  id="rule-limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ruleDraft.value}
                  onChange={(e) => setRuleDraft({ ...ruleDraft, value: e.target.value })}
                  placeholder="50.00"
                  className="w-full bg-transparent font-display text-lg font-bold text-ink focus:outline-none"
                />
              </div>
            </div>
          )}

          {ruleFormError && (
            <p className="flex items-center gap-2 rounded-2xl bg-coral/15 px-3 py-2 text-sm font-medium text-ink" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
              {ruleFormError}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-3 font-bold text-paper transition hover:-translate-y-0.5 hover:bg-ink/90"
            >
              <ShieldCheck className="h-4 w-4 text-lime" aria-hidden="true" />
              Add to my firewall
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-ink/15 px-5 py-3 font-bold text-ink transition hover:border-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
