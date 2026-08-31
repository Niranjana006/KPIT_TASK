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
import { errorMessage, useRefreshWorkspace, usersQuery } from "@/hooks/queries";
import { createProject, updateProject } from "@/services/projectService";
import type { Project, ProjectInput, ProjectStatus } from "@/types";
import { fromDateInput, projectStatusLabels, projectStatuses, toDateInput } from "@/utils/format";

type Draft = {
  name: string;
  key: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  key: "",
  description: "",
  ownerId: "",
  status: "planning",
  startDate: toDateInput(new Date().toISOString()),
  dueDate: "",
});

const suggestKey = (name: string) =>
  name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}) {
  const { data: users = [] } = useQuery(usersQuery());
  const refresh = useRefreshWorkspace();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [keyTouched, setKeyTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setKeyTouched(Boolean(project));
    setDraft(
      project
        ? {
            name: project.name,
            key: project.key,
            description: project.description,
            ownerId: project.ownerId,
            status: project.status,
            startDate: toDateInput(project.startDate),
            dueDate: toDateInput(project.dueDate),
          }
        : { ...emptyDraft(), ownerId: users[0]?.id ?? "" },
    );
  }, [open, project, users]);

  const mutation = useMutation({
    mutationFn: async (input: ProjectInput) =>
      project ? updateProject(project.id, input) : createProject(input),
    onSuccess: (saved) => {
      refresh();
      toast.success(project ? "Project updated" : "Project created", {
        description: `${saved.key} · ${saved.name}`,
      });
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn’t save project", { description: errorMessage(error) }),
  });

  const validate = () => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (!draft.name.trim()) next.name = "Give the project a name.";
    else if (draft.name.trim().length < 3) next.name = "Use at least 3 characters.";
    if (!/^[A-Z][A-Z0-9]{1,5}$/.test(draft.key))
      next.key = "2–6 characters, uppercase letters or digits.";
    if (!draft.ownerId) next.ownerId = "Select an owner.";
    if (!draft.dueDate) next.dueDate = "A target date keeps delivery honest.";
    else if (draft.startDate && draft.dueDate < draft.startDate)
      next.dueDate = "Due date must be after the start date.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: draft.name.trim(),
      key: draft.key.trim(),
      description: draft.description.trim(),
      ownerId: draft.ownerId,
      status: draft.status,
      startDate: fromDateInput(draft.startDate),
      dueDate: fromDateInput(draft.dueDate),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{project ? `Edit ${project.key}` : "Create project"}</DialogTitle>
          <DialogDescription>
            Projects sit at the top of the hierarchy: they hold user stories, which hold tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field id="project-name" label="Name" required error={errors.name}>
              <Input
                id="project-name"
                value={draft.name}
                aria-invalid={Boolean(errors.name)}
                placeholder="Atlas Platform"
                onChange={(event) => {
                  const name = event.target.value;
                  setDraft((d) => ({
                    ...d,
                    name,
                    key: keyTouched ? d.key : suggestKey(name),
                  }));
                }}
              />
            </Field>
            <Field
              id="project-key"
              label="Key"
              required
              error={errors.key}
              hint={errors.key ? undefined : "Used for IDs"}
            >
              <Input
                id="project-key"
                value={draft.key}
                aria-invalid={Boolean(errors.key)}
                placeholder="ATL"
                className="font-mono uppercase"
                onChange={(event) => {
                  setKeyTouched(true);
                  setDraft((d) => ({ ...d, key: event.target.value.toUpperCase() }));
                }}
              />
            </Field>
          </div>

          <Field id="project-description" label="Description">
            <Textarea
              id="project-description"
              rows={3}
              value={draft.description}
              placeholder="What outcome does this project deliver?"
              onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="project-owner" label="Owner" required error={errors.ownerId}>
              <Select
                value={draft.ownerId}
                onValueChange={(ownerId) => setDraft((d) => ({ ...d, ownerId }))}
              >
                <SelectTrigger id="project-owner" aria-invalid={Boolean(errors.ownerId)}>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} · {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="project-status" label="Status">
              <Select
                value={draft.status}
                onValueChange={(status) =>
                  setDraft((d) => ({ ...d, status: status as ProjectStatus }))
                }
              >
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {projectStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="project-start" label="Start date">
              <Input
                id="project-start"
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft((d) => ({ ...d, startDate: event.target.value }))}
              />
            </Field>
            <Field id="project-due" label="Due date" required error={errors.dueDate}>
              <Input
                id="project-due"
                type="date"
                value={draft.dueDate}
                aria-invalid={Boolean(errors.dueDate)}
                onChange={(event) => setDraft((d) => ({ ...d, dueDate: event.target.value }))}
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
              {mutation.isPending ? "Saving…" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
