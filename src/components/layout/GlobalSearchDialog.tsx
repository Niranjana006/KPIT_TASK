import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FolderKanban, ListTree, SquareCheck } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { projectsQuery, searchQuery } from "@/hooks/queries";
import { useWorkItemDrawer } from "@/features/workitems/context";
import { statusLabels } from "@/utils/format";

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { openStory, openTask } = useWorkItemDrawer();
  const { data: projects = [] } = useQuery(projectsQuery());
  const { data: results, isFetching } = useQuery({ ...searchQuery(term), enabled: open });

  useEffect(() => {
    if (!open) setTerm("");
  }, [open]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.key ?? "";

  const close = () => onOpenChange(false);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search projects, stories and tasks…"
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {isFetching ? "Searching…" : `No results for “${term}”.`}
        </CommandEmpty>

        {results?.projects.length ? (
          <CommandGroup heading="Projects">
            {results.projects.map((project) => (
              <CommandItem
                key={project.id}
                value={`${term} project ${project.key} ${project.name}`}
                onSelect={() => {
                  close();
                  navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
                }}
              >
                <FolderKanban className="size-4 text-muted-foreground" />
                <span className="font-medium">{project.name}</span>
                <span className="text-ref ml-auto">{project.key}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {results?.stories.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="User stories">
              {results.stories.map((story) => (
                <CommandItem
                  key={story.id}
                  value={`${term} story ${story.ref} ${story.title}`}
                  onSelect={() => {
                    close();
                    openStory(story.id);
                  }}
                >
                  <ListTree className="size-4 text-muted-foreground" />
                  <span className="text-ref">{story.ref}</span>
                  <span className="truncate">{story.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {projectName(story.projectId)} · {statusLabels[story.status]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {results?.tasks.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {results.tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`${term} task ${task.ref} ${task.title}`}
                  onSelect={() => {
                    close();
                    openTask(task.id);
                  }}
                >
                  <SquareCheck className="size-4 text-muted-foreground" />
                  <span className="text-ref">{task.ref}</span>
                  <span className="truncate">{task.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {projectName(task.projectId)} · {statusLabels[task.status]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
