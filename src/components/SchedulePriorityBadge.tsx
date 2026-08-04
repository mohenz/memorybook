import { SchedulePriority } from '../types';

const STYLE: Record<SchedulePriority, string> = {
  high: 'bg-error/10 text-error border-error/30',
  normal: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-outline-variant/20 text-on-surface-variant border-outline-variant',
};

const LABEL: Record<SchedulePriority, string> = { high: 'HIGH', normal: 'NORMAL', low: 'LOW' };

export default function SchedulePriorityBadge({ priority }: { priority: SchedulePriority }) {
  return <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold ${STYLE[priority]}`}>{LABEL[priority]}</span>;
}
