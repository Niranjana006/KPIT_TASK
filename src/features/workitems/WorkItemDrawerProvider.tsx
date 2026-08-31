import { useCallback, useMemo, useState, type ReactNode } from "react";

import { StoryDrawer } from "./StoryDrawer";
import { TaskDrawer } from "./TaskDrawer";
import { WorkItemDrawerContext, type WorkItemSelection } from "./context";

export function WorkItemDrawerProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<WorkItemSelection>(null);

  const openTask = useCallback((id: string) => setSelection({ kind: "task", id }), []);
  const openStory = useCallback((id: string) => setSelection({ kind: "story", id }), []);
  const close = useCallback(() => setSelection(null), []);

  const api = useMemo(
    () => ({ selection, openTask, openStory, close }),
    [selection, openTask, openStory, close],
  );

  return (
    <WorkItemDrawerContext.Provider value={api}>
      {children}
      <TaskDrawer
        taskId={selection?.kind === "task" ? selection.id : null}
        onOpenChange={(open) => !open && close()}
      />
      <StoryDrawer
        storyId={selection?.kind === "story" ? selection.id : null}
        onOpenChange={(open) => !open && close()}
      />
    </WorkItemDrawerContext.Provider>
  );
}
