import { useQuery } from "@tanstack/react-query";

import { UserAvatar } from "@/components/common/UserAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersQuery } from "@/hooks/queries";
import type { Priority, WorkStatus } from "@/types";
import { priorities, priorityLabels, statusLabels, workStatuses } from "@/utils/format";

const UNASSIGNED = "__unassigned__";

export function StatusSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: WorkStatus;
  onChange: (status: WorkStatus) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as WorkStatus)} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Status">
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
  );
}

export function PrioritySelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Priority)} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Priority">
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
  );
}

export function AssigneeSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string | null;
  onChange: (assigneeId: string | null) => void;
  disabled?: boolean;
  id?: string;
}) {
  const { data: users = [] } = useQuery(usersQuery());
  return (
    <Select
      value={value ?? UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label="Assignee">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <span className="flex items-center gap-2">
              <UserAvatar user={user} size="xs" />
              {user.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
