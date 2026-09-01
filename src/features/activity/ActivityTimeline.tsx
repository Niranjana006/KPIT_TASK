import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { RelativeTime } from "@/components/common/RelativeTime";
import { RowSkeleton } from "@/components/common/StateBlocks";
import { UserAvatar } from "@/components/common/UserAvatar";
import { activityQuery, usersQuery } from "@/hooks/queries";
import { describeActivity } from "@/utils/activity";
import { cn } from "@/lib/utils";

export function ActivityTimeline({
  entityId,
  projectId,
  limit,
  emptyLabel = "No activity recorded yet.",
  className,
}: {
  entityId?: string;
  projectId?: string;
  limit?: number;
  emptyLabel?: string;
  className?: string;
}) {
  const { data: users = [] } = useQuery(usersQuery());
  const { data: events, isPending } = useQuery(activityQuery({ entityId, projectId, limit }));

  if (isPending)
    return (
      <div className={className}>
        <RowSkeleton rows={3} />
      </div>
    );
  if (!events?.length) {
    return (
      <EmptyState
        icon={History}
        title="Nothing here yet"
        description={emptyLabel}
        className={cn("py-8", className)}
      />
    );
  }

  return (
    <ol className={cn("space-y-3", className)}>
      {events.map((event) => {
        const actor = users.find((u) => u.id === event.actorId);
        return (
          <li key={event.id} className="flex gap-3">
            <UserAvatar user={actor} size="sm" className="mt-0.5 shrink-0" />
            <div className="min-w-0 text-sm">
              <p className="text-foreground">
                <span className="font-medium">{actor?.name ?? "Someone"}</span>{" "}
                <span className="text-muted-foreground">{describeActivity(event, users)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                <RelativeTime value={event.createdAt} />
                {event.entityType !== "project" ? ` · ${event.entityTitle}` : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
