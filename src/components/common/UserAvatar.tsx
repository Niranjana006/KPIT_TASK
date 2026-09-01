import { cn } from "@/lib/utils";
import type { User } from "@/types";

const colorMap: Record<string, string> = {
  "accent-1": "bg-accent-1/12 text-accent-1 border-accent-1/25",
  "accent-2": "bg-accent-2/12 text-accent-2 border-accent-2/25",
  "accent-3": "bg-accent-3/12 text-accent-3 border-accent-3/25",
  "accent-4": "bg-accent-4/12 text-accent-4 border-accent-4/25",
  "accent-5": "bg-accent-5/12 text-accent-5 border-accent-5/25",
  "accent-6": "bg-accent-6/12 text-accent-6 border-accent-6/25",
};

const sizes = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user?: User | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!user) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed border-border bg-muted font-semibold text-muted-foreground",
          sizes[size],
          className,
        )}
        title="Unassigned"
      >
        ?<span className="sr-only">Unassigned</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-semibold",
        colorMap[user.color] ?? colorMap["accent-1"],
        sizes[size],
        className,
      )}
      title={`${user.name} · ${user.role}`}
    >
      {user.initials}
      <span className="sr-only">{user.name}</span>
    </span>
  );
}

export function AssigneeChip({ user, className }: { user?: User | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <UserAvatar user={user} size="sm" />
      <span className={user ? "text-foreground" : "text-muted-foreground"}>
        {user?.name ?? "Unassigned"}
      </span>
    </span>
  );
}
