import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ListTree, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, RowSkeleton } from "@/components/common/StateBlocks";
import { ProjectStatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { StoryFormDialog } from "@/features/stories/StoryFormDialog";
import { errorMessage, projectQuery, usersQuery, useRefreshWorkspace } from "@/hooks/queries";
import { archiveProject } from "@/services/projectService";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project detail — FlowForge" },
      {
        name: "description",
        content:
          "Project overview with its user stories, task board, backlog, hierarchy and activity history.",
      },
      { property: "og:title", content: "Project detail — FlowForge" },
      {
        property: "og:description",
        content: "Navigate a project's stories and tasks in one workspace.",
      },
    ],
  }),
  component: ProjectDetailLayout,
});

const tabs = [
  { to: "/projects/$projectId", label: "Overview", exact: true },
  { to: "/projects/$projectId/board", label: "Board", exact: false },
  { to: "/projects/$projectId/stories", label: "Stories", exact: false },
  { to: "/projects/$projectId/hierarchy", label: "Hierarchy", exact: false },
  { to: "/projects/$projectId/activity", label: "Activity", exact: false },
] as const;

function ProjectDetailLayout() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const project = useQuery(projectQuery(projectId));
  const { data: users = [] } = useQuery(usersQuery());
  const refresh = useRefreshWorkspace();
  const [editOpen, setEditOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const archive = useMutation({
    mutationFn: () => archiveProject(projectId),
    onSuccess: (updated) => {
      refresh();
      setArchiveOpen(false);
      toast.success(`${updated.name} archived`);
    },
    onError: (error) =>
      toast.error("Couldn’t archive project", { description: errorMessage(error) }),
  });

  if (project.isPending) return <RowSkeleton rows={6} />;
  if (project.isError)
    return <ErrorState error={project.error} onRetry={() => project.refetch()} />;
  if (!project.data) return null;

  const owner = users.find((user) => user.id === project.data.ownerId);
  const members = users.filter((user) => project.data.memberIds.includes(user.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.data.name}
        description={project.data.description}
        breadcrumbs={[{ label: "Projects", to: "/projects" }, { label: project.data.key }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(true)}
              disabled={project.data.status === "archived"}
            >
              Archive
            </Button>
            <Button onClick={() => setStoryOpen(true)}>
              <Plus className="size-4" /> New story
            </Button>
          </div>
        }
      />

      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-3 p-4 text-sm">
        <ProjectStatusBadge status={project.data.status} />
        <span className="text-muted-foreground">
          {formatDate(project.data.startDate)} → {formatDate(project.data.dueDate)}
        </span>
        <span className="flex items-center gap-2">
          <UserAvatar user={owner} size="sm" />
          <span className="text-muted-foreground">
            Owner <span className="font-medium text-foreground">{owner?.name ?? "—"}</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Team</span>
          {members.slice(0, 5).map((member) => (
            <UserAvatar key={member.id} user={member} size="xs" />
          ))}
          {members.length > 5 ? (
            <span className="text-xs text-muted-foreground">+{members.length - 5}</span>
          ) : null}
        </span>
      </div>

      <nav
        aria-label="Project sections"
        className="flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-slim"
      >
        {tabs.map((tab) => {
          const href = tab.to.replace("$projectId", projectId);
          const active = tab.exact
            ? location.pathname === href || location.pathname === `${href}/`
            : location.pathname.startsWith(href);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              params={{ projectId }}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project.data} />
      <StoryFormDialog open={storyOpen} onOpenChange={setStoryOpen} projectId={projectId} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${project.data.name}?`}
        description="The project drops out of active reporting but keeps all stories, tasks and history."
        confirmLabel="Archive project"
        destructive
        loading={archive.isPending}
        onConfirm={() => archive.mutate()}
      />
      <p className="sr-only">
        <ListTree className="size-3" aria-hidden /> Project, story and task hierarchy
      </p>
    </div>
  );
}
