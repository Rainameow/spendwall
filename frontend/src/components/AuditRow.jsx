import { DecisionChip } from './Decision.jsx';
import { decisionFromStatus } from './decisions.js';

export default function AuditRow({ log, compact = false }) {
  const decision = decisionFromStatus(log.status);

  if (compact) {
    return (
      <li className="flex items-center gap-3 py-3">
        <DecisionChip decision={decision} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{log.item}</p>
          <p className="truncate text-xs text-muted">{log.merchant} · {log.timestamp}</p>
        </div>
        <span className="shrink-0 font-display text-base font-bold tabular-nums text-ink">{log.amount}</span>
      </li>
    );
  }

  return (
    <li className="group flex flex-col gap-3 rounded-3xl border-2 border-transparent bg-white p-4 shadow-card transition hover:border-ink sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <DecisionChip decision={decision} className="w-fit shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-bold text-ink">{log.item}</p>
        <p className="truncate text-xs text-muted">{log.agent} · {log.merchant}</p>
      </div>
      <p className="text-sm text-muted sm:max-w-xs sm:truncate">{log.reason}</p>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-0.5">
        <span className="font-display text-lg font-extrabold tabular-nums text-ink">{log.amount}</span>
        <span className="text-xs text-muted">{log.timestamp}</span>
      </div>
    </li>
  );
}
