'use client';

import { STATUS_LABELS, STATUS_BADGE } from '@/lib/constants';
import type { Status } from '@/lib/constants';

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
