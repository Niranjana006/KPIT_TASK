import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { CardSkeletonGrid, ErrorState } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { errorMessage, projectsQuery, storiesQuery, tasksQuery, usersQuery, useRefreshWorkspace } from "@/hooks/queries";
import { archiveProject } from "@/services/projectService";
import type { Project, ProjectStatus } from "@/types";
import { projectStatusLabels, projectStatuses } from "@/utils/format";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — FlowForge" },
      {
        name: "description",
        content:
          "Every project in the workspace with progress, ownership, story and task counts, and archive controls.",
      },
      { property: "og:title", content: "Projects — FlowForge" },
      {
        property: "og:description",
        content: "Browse, create, edit and archive delivery projects.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = useQuery(projectsQuery());
  const { data: stories = [] } = useQuery(storiesQuery());
  const { data: tasks = [] } = useQuery(tasksQuery());
  const { data: users = [] } = useQuery(usersQuery());
  const refresh = useRefreshWorkspace();

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [formProject, setFormProject] = useState<Project | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);

  const archive = useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: (project) => {
      refresh();
      setArchiveTarget(null);
      toast.success(`${project.name} archived`);
    },
    onError: (error) =>
      toast.error("Couldn’t archive project", { description: errorMessage(error) }),
  });

  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (projects.data ?? []).filter((project) => {
      const matchesTerm =
        !q ||
        project.name.toLowerCase().includes(q) ||
        project.key.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q);
      const matchesStatus = status === "all" || project.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [projects.data, term, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Each project owns its user stories, and each story owns its tasks."
        actions={
          <Button
            onClick={() => {
              setFormProject(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> New project
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Filter projects…"
            aria-label="Filter projects"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus | "all")}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {projectStatuses.map((option) => (
              <SelectItem key={option} value={option}>
                {projectStatusLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {visible.length} of {projects.data?.length ?? 0} projects
        </p>
      </div>

      {projects.isPending ? (
        <CardSkeletonGrid count={3} />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => projects.refetch()} />
      ) : visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            return (
              <ProjectCard
                key={project.id}
                project={project}
                owner={users.find((user) => user.id === project.ownerId)}
                storyCount={stories.filter((story) => story.projectId === project.id).length}
                taskCount={projectTasks.length}
                doneTasks={projectTasks.filter((task) => task.status === "done").length}
                onEdit={() => {
                  setFormProject(project);
                  setFormOpen(true);
                }}
                onArchive={() => setArchiveTarget(project)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects match your filters"
          description="Try a different search term or status, or create a new project."
          action={
            <Button
              size="sm"
              onClick={() => {
                setTerm("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={formProject} />
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={`Archive ${archiveTarget?.name ?? "project"}?`}
        description="Archived projects stay readable and keep their stories and tasks, but drop out of active reporting."
        confirmLabel="Archive project"
        destructive
        loading={archive.isPending}
        onConfirm={() => archiveTarget && archive.mutate(archiveTarget.id)}
      />
    </div>
  );
}
