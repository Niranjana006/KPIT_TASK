import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarClock, ListTree, MoreHorizontal, SquareCheck } from "lucide-react";

import { ProjectStatusBadge } from "@/components/common/StatusBadge";
import { RelativeTime } from "@/components/common/RelativeTime";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { Project, User } from "@/types";
import { formatDate, percent } from "@/utils/format";

export function ProjectCard({
  project,
  owner,
  storyCount,
  taskCount,
  doneTasks,
  onEdit,
  onDelete,
}: {
  project: Project;
  owner?: User;
  storyCount: number;
  taskCount: number;
  doneTasks: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = percent(doneTasks, taskCount);

  return (
    <article className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-ref">{project.key}</span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h3 className="mt-1.5 truncate text-base font-semibold text-foreground">
            {project.name}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${project.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                Open project
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>Edit details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive">
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <ListTree className="size-3.5 text-muted-foreground" aria-hidden />
          <dt className="text-muted-foreground">Stories</dt>
          <dd className="font-medium text-foreground tabular-nums">{storyCount}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <SquareCheck className="size-3.5 text-muted-foreground" aria-hidden />
          <dt className="text-muted-foreground">Tasks</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {doneTasks}/{taskCount}
          </dd>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden />
          <dt className="text-muted-foreground">Due</dt>
          <dd className="font-medium text-foreground">{formatDate(project.dueDate)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar user={owner} size="sm" />
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-foreground">{owner?.name ?? "Unassigned"}</p>
            <p className="truncate text-muted-foreground">
              Updated <RelativeTime value={project.updatedAt} />
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/projects/$projectId" params={{ projectId: project.id }}>
            Open <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
