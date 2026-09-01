import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RelativeTime } from "@/components/common/RelativeTime";
import { ErrorState, RowSkeleton } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { errorMessage, notificationsQuery, useRefreshWorkspace } from "@/hooks/queries";
import { dismiss, markAllRead, markRead } from "@/services/notificationService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FlowForge" },
      {
        name: "description",
        content: "Assignments, due-soon reminders and delivery milestones for your workspace.",
      },
      { property: "og:title", content: "Notifications — FlowForge" },
      {
        property: "og:description",
        content: "Stay on top of assignments and delivery milestones.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const notifications = useQuery(notificationsQuery());
  const refresh = useRefreshWorkspace();

  const toggle = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markRead(id, read),
    onSuccess: () => refresh(),
    onError: (error) => toast.error("Couldn’t update", { description: errorMessage(error) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => dismiss(id),
    onSuccess: () => {
      refresh();
      toast.success("Notification dismissed");
    },
    onError: (error) => toast.error("Couldn’t dismiss", { description: errorMessage(error) }),
  });

  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: (count) => {
      refresh();
      toast.success(count ? `${count} marked as read` : "Inbox already clear");
    },
  });

  const unread = (notifications.data ?? []).filter((item) => !item.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread updates` : "You're all caught up."}
        actions={
          <Button
            variant="outline"
            disabled={!unread || readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            <Check className="size-4" /> Mark all read
          </Button>
        }
      />

      {notifications.isPending ? (
        <RowSkeleton rows={5} />
      ) : notifications.isError ? (
        <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
      ) : notifications.data?.length ? (
        <ul className="panel divide-y divide-border">
          {notifications.data.map((item) => (
            <li
              key={item.id}
              className={cn("flex items-start gap-3 p-4", !item.read && "bg-accent/30")}
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  item.read ? "bg-border" : "bg-primary",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <RelativeTime value={item.createdAt} />
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggle.mutate({ id: item.id, read: !item.read })}
                >
                  {item.read ? "Mark unread" : "Mark read"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Dismiss ${item.title}`}
                  onClick={() => remove.mutate(item.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Assignments and due-date reminders will land here as work moves."
        />
      )}
    </div>
  );
}
