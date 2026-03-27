import { PostStatus, STATUS_COLORS } from "@/types/database";

interface StatusBadgeProps {
  status: PostStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {status}
    </span>
  );
}
