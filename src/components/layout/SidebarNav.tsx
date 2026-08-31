import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  Settings,
  SquareCheck,
  Workflow,
} from "lucide-react";

import { UserAvatar } from "@/components/common/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentUserQuery, notificationsQuery } from "@/hooks/queries";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/my-work", label: "My Work", icon: SquareCheck },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useQuery(currentUserQuery());
  const { data: notifications = [] } = useQuery(notificationsQuery());
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Workflow className="size-4" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-sidebar-foreground">FlowForge</p>
          <p className="text-[11px] text-muted-foreground">Agile delivery</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-0.5 px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {to === "/notifications" && unread > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none">
            <UserAvatar user={user} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">
                {user?.name ?? "Loading…"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {user?.role ?? "—"}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuItem className="justify-between">
              Product Engineering <span className="text-xs text-muted-foreground">Current</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Platform Team</DropdownMenuItem>
            <DropdownMenuItem disabled>Design Systems</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" onClick={onNavigate}>
                Profile &amp; preferences
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
