import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  errorMessage,
  projectsQuery,
  useRefreshWorkspace,
  usersQuery,
} from "@/hooks/queries";
import { createStory, updateStory } from "@/services/storyService";
import type { Priority, StoryInput, UserStory, WorkStatus } from "@/types";
import { priorities, priorityLabels, statusLabels, workStatuses } from "@/utils/format";

const UNASSIGNED = "__unassigned__";

type Draft = {
  projectId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: WorkStatus;
  priority: Priority;
  assigneeId: string;
  storyPoints: string;
  sprint: string;
  labels: string;
};

const emptyDraft = (projectId: string): Draft => ({
  projectId,
  title: "",
  description: "",
  acceptanceCriteria: [""],
  status: "backlog",
  priority: "medium",
  assigneeId: UNASSIGNED,
  storyPoints: "3",
  sprint: "Backlog",
  labels: "",
});

export function StoryFormDialog({
  open,
  onOpenChange,
  story,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story?: UserStory;
  projectId?: string;
}) {
  const { data: users = [] } = useQuery(usersQuery());
  const { data: projects = [] } = useQuery(projectsQuery());
  const refresh = useRefreshWorkspace();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(projectId ?? ""));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDraft(
      story
        ? {
            projectId: story.projectId,
            title: story.title,
            description: story.description,
            acceptanceCriteria: story.acceptanceCriteria.length
              ? [...story.acceptanceCriteria]
              : [""],
            status: story.status,
            priority: story.priority,
            assigneeId: story.assigneeId ?? UNASSIGNED,
            storyPoints: String(story.storyPoints),
            sprint: story.sprint,
            labels: story.labels.join(", "),
          }
        : emptyDraft(projectId ?? projects[0]?.id ?? ""),
    );
  }, [open, story, projectId, projects]);

  const mutation = useMutation({
    mutationFn: async (input: StoryInput) =>
      story ? updateStory(story.id, input) : createStory(input),
    onSuccess: (saved) => {
      refresh();
      toast.success(story ? "Story updated" : "Story created", {
        description: `${saved.ref} · ${saved.title}`,
      });
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn’t save story", { description: errorMessage(error) }),
  });

  const validate = () => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (!draft.projectId) next.projectId = "A story must belong to a project.";
    if (!draft.title.trim()) next.title = "Give the story a title.";
    if (!draft.description.trim())
      next.description = "Describe the story from the user’s point of view.";
    if (!draft.acceptanceCriteria.some((c) => c.trim()))
      next.acceptanceCriteria = "Add at least one acceptance criterion.";
    const points = Number(draft.storyPoints);
    if (!Number.isFinite(points) || points < 0) next.storyPoints = "Enter a valid estimate.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      projectId: draft.projectId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      acceptanceCriteria: draft.acceptanceCriteria.map((c) => c.trim()).filter(Boolean),
      status: draft.status,
      priority: draft.priority,
      assigneeId: draft.assigneeId === UNASSIGNED ? null : draft.assigneeId,
      storyPoints: Number(draft.storyPoints),
      sprint: draft.sprint.trim() || "Backlog",
      labels: draft.labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    });
  };

  const setCriterion = (index: number, value: string) =>
    setDraft((d) => ({
      ...d,
      acceptanceCriteria: d.acceptanceCriteria.map((c, i) => (i === index ? value : c)),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{story ? `Edit ${story.ref}` : "Create user story"}</DialogTitle>
          <DialogDescription>
            Stories describe user value. Break them into tasks once the outcome is agreed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="story-project" label="Project" required error={errors.projectId}>
              <Select
                value={draft.projectId}
                onValueChange={(value) => setDraft((d) => ({ ...d, projectId: value }))}
                disabled={Boolean(story)}
              >
                <SelectTrigger id="story-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.key} · {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="story-sprint" label="Sprint">
              <Input
                id="story-sprint"
                value={draft.sprint}
                placeholder="Sprint 14"
                onChange={(event) => setDraft((d) => ({ ...d, sprint: event.target.value }))}
              />
            </Field>
          </div>

          <Field id="story-title" label="Title" required error={errors.title}>
            <Input
              id="story-title"
              value={draft.title}
              aria-invalid={Boolean(errors.title)}
              placeholder="User authentication"
              onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
            />
          </Field>

          <Field
            id="story-description"
            label="Description"
            required
            error={errors.description}
            hint={errors.description ? undefined : "As a <role>, I want <capability> so that <benefit>."}
          >
            <Textarea
              id="story-description"
              rows={3}
              value={draft.description}
              aria-invalid={Boolean(errors.description)}
              placeholder="As a user, I want to securely log in so that I can access my projects."
              onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
            />
          </Field>

          <Field
            id="story-criteria-0"
            label="Acceptance criteria"
            required
            error={errors.acceptanceCriteria}
          >
            <div className="space-y-2">
              {draft.acceptanceCriteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    id={`story-criteria-${index}`}
                    value={criterion}
                    placeholder={index === 0 ? "User can enter an email address" : "Add a criterion"}
                    onChange={(event) => setCriterion(index, event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove criterion ${index + 1}`}
                    disabled={draft.acceptanceCriteria.length === 1}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        acceptanceCriteria: d.acceptanceCriteria.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraft((d) => ({ ...d, acceptanceCriteria: [...d.acceptanceCriteria, ""] }))
                }
              >
                <Plus className="size-3.5" /> Add criterion
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="story-status" label="Status">
              <Select
                value={draft.status}
                onValueChange={(value) => setDraft((d) => ({ ...d, status: value as WorkStatus }))}
              >
                <SelectTrigger id="story-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="story-priority" label="Priority">
              <Select
                value={draft.priority}
                onValueChange={(value) => setDraft((d) => ({ ...d, priority: value as Priority }))}
              >
                <SelectTrigger id="story-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="story-assignee" label="Assignee">
              <Select
                value={draft.assigneeId}
                onValueChange={(value) => setDraft((d) => ({ ...d, assigneeId: value }))}
              >
                <SelectTrigger id="story-assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="story-points" label="Story points" error={errors.storyPoints}>
              <Input
                id="story-points"
                type="number"
                min={0}
                max={100}
                value={draft.storyPoints}
                onChange={(event) => setDraft((d) => ({ ...d, storyPoints: event.target.value }))}
              />
            </Field>
          </div>

          <Field id="story-labels" label="Labels" hint="Comma separated, e.g. auth, security">
            <Input
              id="story-labels"
              value={draft.labels}
              onChange={(event) => setDraft((d) => ({ ...d, labels: event.target.value }))}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : story ? "Save changes" : "Create story"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
