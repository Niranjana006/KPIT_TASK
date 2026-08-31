import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { RowSkeleton } from "@/components/common/StateBlocks";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { currentUserQuery, errorMessage, usersQuery, useRefreshWorkspace } from "@/hooks/queries";
import { updateUser } from "@/services/userService";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FlowForge" },
      {
        name: "description",
        content: "Manage your profile, notification preferences and workspace team members.",
      },
      { property: "og:title", content: "Settings — FlowForge" },
      {
        property: "og:description",
        content: "Profile, preferences and team management for your FlowForge workspace.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = useQuery(currentUserQuery());
  const { data: users = [] } = useQuery(usersQuery());
  const refresh = useRefreshWorkspace();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [prefs, setPrefs] = useState({ assignments: true, dueSoon: true, digest: false });

  useEffect(() => {
    if (user.data) {
      setName(user.data.name);
      setEmail(user.data.email);
    }
  }, [user.data]);

  const save = useMutation({
    mutationFn: () => updateUser(user.data!.id, { name: name.trim(), email: email.trim() }),
    onSuccess: () => {
      refresh();
      toast.success("Profile updated");
    },
    onError: (err) => toast.error("Couldn’t save profile", { description: errorMessage(err) }),
  });

  if (user.isPending) return <RowSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, preferences and workspace team." />

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <form
          className="mt-4 grid gap-4 sm:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Name is required.");
              return;
            }
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
              setError("Enter a valid email address.");
              return;
            }
            setError(undefined);
            save.mutate();
          }}
        >
          <div className="flex items-center gap-3">
            <UserAvatar user={user.data} size="lg" />
            <p className="text-sm text-muted-foreground">{user.data?.role}</p>
          </div>
          <Field label="Full name" id="name" required error={error}>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Email" id="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-foreground">Notification preferences</h2>
        <ul className="mt-3 divide-y divide-border">
          {(
            [
              ["assignments", "Task assignments", "Notify me when work is assigned to me."],
              ["dueSoon", "Due soon reminders", "Remind me about tasks due within two days."],
              ["digest", "Weekly delivery digest", "Send a Monday summary of project progress."],
            ] as const
          ).map(([key, label, description]) => (
            <li key={key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={prefs[key]}
                aria-label={label}
                onCheckedChange={(checked) => {
                  setPrefs((state) => ({ ...state, [key]: checked }));
                  toast.success(`${label} ${checked ? "enabled" : "disabled"}`);
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-foreground">Team</h2>
        <ul className="mt-3 divide-y divide-border">
          {users.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <UserAvatar user={member} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{member.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
