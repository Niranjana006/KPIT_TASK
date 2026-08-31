import { createContext, useContext } from "react";

export type WorkItemSelection =
  | { kind: "task"; id: string }
  | { kind: "story"; id: string }
  | null;

export interface WorkItemDrawerApi {
  selection: WorkItemSelection;
  openTask: (id: string) => void;
  openStory: (id: string) => void;
  close: () => void;
}

export const WorkItemDrawerContext = createContext<WorkItemDrawerApi | null>(null);

export function useWorkItemDrawer(): WorkItemDrawerApi {
  const ctx = useContext(WorkItemDrawerContext);
  if (!ctx)
    throw new Error("useWorkItemDrawer must be used inside <WorkItemDrawerProvider>.");
  return ctx;
}
