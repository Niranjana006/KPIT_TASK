import { cn } from "@/lib/utils";

export function LabelList({
  labels,
  className,
  max,
}: {
  labels: string[];
  className?: string;
  max?: number;
}) {
  if (!labels.length) return null;
  const visible = max ? labels.slice(0, max) : labels;
  const hidden = max ? labels.length - visible.length : 0;
  return (
    <ul className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((label) => (
        <li
          key={label}
          className="rounded border border-border bg-surface-raised px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {label}
        </li>
      ))}
      {hidden > 0 ? (
        <li className="text-[11px] text-muted-foreground">+{hidden}</li>
      ) : null}
    </ul>
  );
}
