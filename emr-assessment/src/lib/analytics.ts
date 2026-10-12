"use client";

type EventName =
  | "assessment_start"
  | "profile_complete"
  | "section_complete"
  | "lead_submitted"
  | "demo_click"
  | "pdf_download"
  | "report_emailed"
  | "report_shared";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Send a GA4 event. A no-op when GA4_ID isn't configured. Never pass contact details here. */
export function track(event: EventName, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
}
