import { createFileRoute } from "@tanstack/react-router";

import { ActivityTimeline } from "@/features/activity/ActivityTimeline";

export const Route = createFileRoute("/projects/$projectId/activity")({
  component: ProjectActivityPage,
});

function ProjectActivityPage() {
  const { projectId } = Route.useParams();
  return (
    <section className="panel p-5">
      <h2 className="text-sm font-semibold text-foreground">Project activity</h2>
      <p className="text-xs text-muted-foreground">
        Every status change, assignment and edit recorded for this project.
      </p>
      <ActivityTimeline
        projectId={projectId}
        className="mt-4"
        emptyLabel="Activity will appear here as the team updates work."
      />
    </section>
  );
}
