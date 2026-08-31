import { ArrowDown, ArrowUp, Equal, Flame } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Priority } from "@/types";
import { priorityLabels } from "@/utils/format";

const styles: Record<Priority, string> = {
  low: "text-priority-low",
  medium: "text-priority-medium",
  high: "text-priority-high",
  critical: "text-priority-critical",
};

const icons: Record<Priority, typeof ArrowDown> = {
  low: ArrowDown,
  medium: Equal,
  high: ArrowUp,
  critical: Flame,
};

export function PriorityBadge({
  priority,
  className,
  withLabel = true,
}: {
  priority: Priority;
  className?: string;
  withLabel?: boolean;
}) {
  const Icon = icons[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        styles[priority],
        className,
      )}
      title={`${priorityLabels[priority]} priority`}
    >
      <Icon className="size-3.5" aria-hidden />
      {withLabel ? priorityLabels[priority] : <span className="sr-only">{priorityLabels[priority]}</span>}
    </span>
  );
}
