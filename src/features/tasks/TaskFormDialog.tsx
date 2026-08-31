import { useMutation, useQuery } from "@tanstack/react-query";
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
  storiesQuery,
  useRefreshWorkspace,
  usersQuery,
} from "@/hooks/queries";
import { createTask, updateTask } from "@/services/taskService";
import type { Priority, Task, TaskInput, WorkStatus } from "@/types";
import {
  fromDateInput,
  priorities,
  priorityLabels,
  statusLabels,
  toDateInput,
  workStatuses,
} from "@/utils/format";

const UNASSIGNED = "__unassigned__";

type Draft = {
  projectId: string;
  storyId: string;
  title: string;
  description: string;
  status: WorkStatus;
  priority: Priority;
  assigneeId: string;
  dueDate: string;
  estimatedHours: string;
  labels: string;
};

const emptyDraft = (projectId: string, storyId: string): Draft => ({
  projectId,
  storyId,
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigneeId: UNASSIGNED,
  dueDate: "",
  estimatedHours: "4",
  labels: "",
});

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projectId,
  storyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  projectId?: string;
  storyId?: string;
}) {
  const { data: users = [] } = useQuery(usersQuery());
  const { data: projects = [] } = useQuery(projectsQuery());
  const refresh = useRefreshWorkspace();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(projectId ?? "", storyId ?? ""));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    ...storiesQuery(draft.projectId || undefined),
    enabled: Boolean(draft.projectId),
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDraft(
      task
        ? {
            projectId: task.projectId,
            storyId: task.storyId,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId ?? UNASSIGNED,
            dueDate: toDateInput(task.dueDate),
            estimatedHours: String(task.estimatedHours),
            labels: task.labels.join(", "),
          }
        : emptyDraft(projectId ?? projects[0]?.id ?? "", storyId ?? ""),
    );
  }, [open, task, projectId, storyId, projects]);

  const mutation = useMutation({
    mutationFn: async (input: TaskInput) =>
      task ? updateTask(task.id, input) : createTask(input),
    onSuccess: (saved) => {
      refresh();
      toast.success(task ? "Task updated" : "Task created", {
        description: `${saved.ref} · ${saved.title}`,
      });
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn’t save task", { description: errorMessage(error) }),
  });

  const validate = () => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (!draft.projectId) next.projectId = "Select a project.";
    if (!draft.storyId) next.storyId = "Every task must sit under a user story.";
    if (!draft.title.trim()) next.title = "Give the task a title.";
    const hours = Number(draft.estimatedHours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 200)
      next.estimatedHours = "Enter between 0 and 200 hours.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      projectId: draft.projectId,
      storyId: draft.storyId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: draft.status,
      priority: draft.priority,
      assigneeId: draft.assigneeId === UNASSIGNED ? null : draft.assigneeId,
      dueDate: draft.dueDate ? fromDateInput(draft.dueDate) : null,
      estimatedHours: Number(draft.estimatedHours),
      labels: draft.labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? `Edit ${task.ref}` : "Create task"}</DialogTitle>
          <DialogDescription>
            Tasks are the smallest unit of work and always belong to a user story.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="task-project" label="Project" required error={errors.projectId}>
              <Select
                value={draft.projectId}
                disabled={Boolean(task)}
                onValueChange={(value) =>
                  setDraft((d) => ({ ...d, projectId: value, storyId: "" }))
                }
              >
                <SelectTrigger id="task-project">
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
            <Field
              id="task-story"
              label="User story"
              required
              error={errors.storyId}
              hint={
                errors.storyId
                  ? undefined
                  : storiesLoading
                    ? "Loading stories…"
                    : `${stories.length} stories in this project`
              }
            >
              <Select
                value={draft.storyId}
                disabled={!draft.projectId || storiesLoading || stories.length === 0}
                onValueChange={(value) => setDraft((d) => ({ ...d, storyId: value }))}
              >
                <SelectTrigger id="task-story" aria-invalid={Boolean(errors.storyId)}>
                  <SelectValue
                    placeholder={stories.length ? "Select story" : "No stories available"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {stories.map((story) => (
                    <SelectItem key={story.id} value={story.id}>
                      {story.ref} · {story.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field id="task-title" label="Title" required error={errors.title}>
            <Input
              id="task-title"
              value={draft.title}
              aria-invalid={Boolean(errors.title)}
              placeholder="Login API endpoint"
              onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
            />
          </Field>

          <Field id="task-description" label="Description">
            <Textarea
              id="task-description"
              rows={3}
              value={draft.description}
              placeholder="What needs to happen, and what does done look like?"
              onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="task-status" label="Status">
              <Select
                value={draft.status}
                onValueChange={(value) => setDraft((d) => ({ ...d, status: value as WorkStatus }))}
              >
                <SelectTrigger id="task-status">
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
            <Field id="task-priority" label="Priority">
              <Select
                value={draft.priority}
                onValueChange={(value) => setDraft((d) => ({ ...d, priority: value as Priority }))}
              >
                <SelectTrigger id="task-priority">
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
            <Field id="task-assignee" label="Assignee">
              <Select
                value={draft.assigneeId}
                onValueChange={(value) => setDraft((d) => ({ ...d, assigneeId: value }))}
              >
                <SelectTrigger id="task-assignee">
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
            <Field id="task-hours" label="Estimated hours" error={errors.estimatedHours}>
              <Input
                id="task-hours"
                type="number"
                min={0}
                max={200}
                value={draft.estimatedHours}
                onChange={(event) =>
                  setDraft((d) => ({ ...d, estimatedHours: event.target.value }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="task-due" label="Due date">
              <Input
                id="task-due"
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((d) => ({ ...d, dueDate: event.target.value }))}
              />
            </Field>
            <Field id="task-labels" label="Labels" hint="Comma separated">
              <Input
                id="task-labels"
                value={draft.labels}
                placeholder="backend, api"
                onChange={(event) => setDraft((d) => ({ ...d, labels: event.target.value }))}
              />
            </Field>
          </div>

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
              {mutation.isPending ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
