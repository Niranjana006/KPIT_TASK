import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityTimeline } from "@/features/activity/ActivityTimeline";
import { projectsQuery } from "@/hooks/queries";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — FlowForge" },
      {
        name: "description",
        content: "Chronological audit trail of every create, assign, status change and edit.",
      },
      { property: "og:title", content: "Activity — FlowForge" },
      {
        property: "og:description",
        content: "Follow how work moved across projects, stories and tasks.",
      },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { data: projects = [] } = useQuery(projectsQuery());
  const [projectId, setProjectId] = useState("all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="A chronological record of everything the team changed."
        actions={
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-56" aria-label="Filter activity by project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.key} · {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section className="panel p-5">
        <ActivityTimeline
          projectId={projectId === "all" ? undefined : projectId}
          limit={50}
          emptyLabel="No activity recorded for this filter yet."
        />
      </section>
    </div>
  );
}
