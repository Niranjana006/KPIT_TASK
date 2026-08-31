import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  to,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning" | "positive";
  to?: string;
}) {
  const toneClass =
    tone === "warning"
      ? "text-priority-critical"
      : tone === "positive"
        ? "text-status-done"
        : "text-foreground";

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className={cn("mt-3 text-3xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="panel block p-4 transition-colors hover:border-ring/40 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {content}
      </Link>
    );
  }
  return <div className="panel p-4">{content}</div>;
}
