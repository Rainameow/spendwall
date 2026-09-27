import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const DECISIONS = {
  ALLOW: {
    label: 'ALLOW',
    icon: CheckCircle2,
    chip: 'bg-lime text-ink',
    soft: 'bg-lime/25',
    blurb: 'Fits every rule you set. Checkout continues as normal.',
  },
  WARN: {
    label: 'WARN',
    icon: AlertTriangle,
    chip: 'bg-sun text-ink',
    soft: 'bg-sun/30',
    blurb: 'Something needs your eyes first. You decide to proceed or stop.',
  },
  BLOCK: {
    label: 'BLOCK',
    icon: XCircle,
    chip: 'bg-coral text-ink',
    soft: 'bg-coral/20',
    blurb: 'Breaks one of your rules. Stopped before any money moves.',
  },
};

export function decisionFromStatus(status) {
  if (status === 'Blocked') return 'BLOCK';
  if (status.includes('Warned')) return 'WARN';
  return 'ALLOW';
}

export function decisionFromSeverity(severity) {
  if (severity === 'danger') return 'BLOCK';
  if (severity === 'warning') return 'WARN';
  return 'ALLOW';
}
