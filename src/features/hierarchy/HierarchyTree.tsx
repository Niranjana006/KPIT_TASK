import { ChevronDown, ChevronRight, ListTree } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { cn } from "@/lib/utils";
import type { Task, User, UserStory } from "@/types";
import { percent } from "@/utils/format";
import { useWorkItemDrawer } from "@/features/workitems/context";

export function HierarchyTree({
  projectName,
  projectKey,
  stories,
  tasks,
  users,
}: {
  projectName: string;
  projectKey: string;
  stories: UserStory[];
  tasks: Task[];
  users: User[];
}) {
  const { openStory, openTask } = useWorkItemDrawer();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!stories.length) {
    return (
      <EmptyState
        icon={ListTree}
        title="No stories in this project"
        description="Create a user story to start building out the hierarchy of work."
      />
    );
  }

  return (
    <div className="panel p-2 sm:p-4">
      <p className="px-2 pb-2 font-mono text-xs font-semibold tracking-wide text-foreground uppercase">
        {projectKey} · {projectName}
      </p>
      <ul className="space-y-1">
        {stories.map((story) => {
          const storyTasks = tasks.filter((task) => task.storyId === story.id);
          const done = storyTasks.filter((task) => task.status === "done").length;
          const isCollapsed = collapsed[story.id] ?? false;
          return (
            <li key={story.id} className="border-l border-border pl-2 sm:pl-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${story.ref}`}
                  onClick={() => setCollapsed((state) => ({ ...state, [story.id]: !isCollapsed }))}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openStory(story.id, story.projectId)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="text-ref shrink-0">{story.ref}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {story.title}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {done}/{storyTasks.length} tasks · {percent(done, storyTasks.length)}%
                  </span>
                  <StatusBadge status={story.status} showDot={false} />
                  <UserAvatar
                    user={users.find((u) => u.id === story.assigneeId)}
                    size="xs"
                    className="hidden sm:inline-flex"
                  />
                </button>
              </div>

              {!isCollapsed ? (
                <ul className="mt-0.5 mb-1 ml-6 space-y-0.5 border-l border-dashed border-border pl-2 sm:ml-7">
                  {storyTasks.length ? (
                    storyTasks.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => openTask(task.id)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span className="text-ref shrink-0">{task.ref}</span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm",
                              task.status === "done"
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {task.title}
                          </span>
                          <PriorityBadge priority={task.priority} withLabel={false} />
                          <StatusBadge status={task.status} showDot={false} />
                          <UserAvatar
                            user={users.find((u) => u.id === task.assigneeId)}
                            size="xs"
                            className="hidden sm:inline-flex"
                          />
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-1.5 text-xs text-muted-foreground">
                      No tasks under this story yet.
                    </li>
                  )}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
