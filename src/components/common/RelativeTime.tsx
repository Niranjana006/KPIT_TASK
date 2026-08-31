import { useEffect, useState } from "react";

import { formatDateTime, formatRelative } from "@/utils/format";

/**
 * Renders an absolute timestamp on the server and swaps to a relative label
 * after hydration, avoiding SSR/client text mismatches.
 */
export function RelativeTime({ value, className }: { value: string; className?: string }) {
  const [label, setLabel] = useState(() => formatDateTime(value));

  useEffect(() => {
    setLabel(formatRelative(value));
    const id = setInterval(() => setLabel(formatRelative(value)), 60_000);
    return () => clearInterval(id);
  }, [value]);

  return (
    <time dateTime={value} title={formatDateTime(value)} className={className}>
      {label}
    </time>
  );
}
