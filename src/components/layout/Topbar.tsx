import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RelativeTime } from "@/components/common/RelativeTime";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { currentUserQuery, notificationsQuery, useRefreshWorkspace } from "@/hooks/queries";
import { markAllRead } from "@/services/notificationService";
import { logout } from "@/services/authService";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { StoryFormDialog } from "@/features/stories/StoryFormDialog";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";

export function Topbar({
  onOpenSidebar,
  onOpenSearch,
}: {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}) {
  const navigate = useNavigate();
  const refresh = useRefreshWorkspace();
  const { data: user } = useQuery(currentUserQuery());
  const { data: notifications = [] } = useQuery(notificationsQuery());
  const [creating, setCreating] = useState<null | "project" | "story" | "task">(null);

  const unread = notifications.filter((n) => !n.read);

  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: (count) => {
      refresh();
      toast.success(count ? `${count} notifications marked as read` : "Inbox already clear");
    },
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
      >
        <Menu className="size-4" />
      </Button>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:max-w-sm"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Search work…</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="hidden size-3.5 sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => setCreating("project")}>Project</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCreating("story")}>User story</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCreating("task")}>Task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Notifications (${unread.length} unread)`}
              className="relative"
            >
              <Bell className="size-4" />
              {unread.length ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              <Button
                variant="ghost"
                size="sm"
                disabled={!unread.length || markAll.isPending}
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </Button>
            </div>
            <ul className="max-h-72 divide-y divide-border overflow-y-auto scrollbar-slim">
              {notifications.slice(0, 6).map((notification) => (
                <li key={notification.id} className="px-3 py-2.5">
                  <p className="flex items-start gap-2 text-sm font-medium text-foreground">
                    {!notification.read ? (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : (
                      <span className="mt-1.5 size-1.5 shrink-0" />
                    )}
                    {notification.title}
                  </p>
                  <p className="pl-3.5 text-xs text-muted-foreground">
                    <RelativeTime value={notification.createdAt} />
                  </p>
                </li>
              ))}
              {!notifications.length ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  You’re all caught up.
                </li>
              ) : null}
            </ul>
            <div className="border-t border-border p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate({ to: "/notifications" })}
              >
                Open notification center
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <UserAvatar user={user} size="md" />
            <span className="sr-only">Open user menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{user?.name}</span>
              <span className="block text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/my-work">My work</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  await logout();
                  refresh(); // Invalidate all queries and trigger redirect in __root
                  toast.success("Signed out successfully");
                } catch (e) {
                  toast.error("Failed to sign out");
                }
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProjectFormDialog
        open={creating === "project"}
        onOpenChange={(open) => setCreating(open ? "project" : null)}
      />
      <StoryFormDialog
        open={creating === "story"}
        onOpenChange={(open) => setCreating(open ? "story" : null)}
      />
      <TaskFormDialog
        open={creating === "task"}
        onOpenChange={(open) => setCreating(open ? "task" : null)}
      />
    </header>
  );
}
