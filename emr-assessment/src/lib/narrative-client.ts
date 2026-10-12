"use client";

const started = new Set<string>();

/**
 * Start AI report generation while the "Analyzing" screen and lead form are on
 * screen. The server caches the result, so the report page streams it quickly.
 */
export function prefetchNarrative(id: string): void {
  if (started.has(id)) return;
  started.add(id);
  fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    keepalive: true,
  }).catch(() => started.delete(id));
}
