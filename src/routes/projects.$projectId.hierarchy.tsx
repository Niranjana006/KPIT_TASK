import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { RowSkeleton } from "@/components/common/StateBlocks";
import { HierarchyTree } from "@/features/hierarchy/HierarchyTree";
import { projectQuery, storiesQuery, tasksQuery, usersQuery } from "@/hooks/queries";

export const Route = createFileRoute("/projects/$projectId/hierarchy")({
  component: HierarchyPage,
});

function HierarchyPage() {
  const { projectId } = Route.useParams();
  const project = useQuery(projectQuery(projectId));
  const stories = useQuery(storiesQuery(projectId));
  const tasks = useQuery(tasksQuery({ projectId }));
  const { data: users = [] } = useQuery(usersQuery());

  if (project.isPending || stories.isPending || tasks.isPending) return <RowSkeleton rows={6} />;

  return (
    <HierarchyTree
      projectName={project.data?.name ?? ""}
      projectKey={project.data?.key ?? ""}
      stories={stories.data ?? []}
      tasks={tasks.data ?? []}
      users={users}
    />
  );
}
