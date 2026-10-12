"use client";
import type { Answers, Profile } from "./scoring";

const KEY = "careficient-emr-assessment:v1";

export interface SavedProgress {
  profile: Partial<Profile> & { currentEmr?: string };
  answers: Answers;
  step: number;
  savedAt: number;
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    // Drop progress older than 30 days.
    if (!parsed || Date.now() - parsed.savedAt > 30 * 86_400_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(progress: Omit<SavedProgress, "savedAt">): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...progress, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode, quota); progress just won't persist.
  }
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

const LEAD_KEY = "careficient-emr-assessment:lead";

export function saveLeadReport(reportId: string, demoUrl?: string): void {
  try {
    window.sessionStorage.setItem(LEAD_KEY, JSON.stringify({ reportId, demoUrl }));
  } catch {}
}

export function loadLeadReport(): { reportId: string; demoUrl?: string } | null {
  try {
    const raw = window.sessionStorage.getItem(LEAD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
