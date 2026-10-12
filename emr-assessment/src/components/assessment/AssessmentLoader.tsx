"use client";
import { useEffect, useSyncExternalStore } from "react";
import { loadProgress, type SavedProgress } from "@/lib/storage";
import { AssessmentFlow } from "./AssessmentFlow";

// Cached per mount so getSnapshot is stable; cleared on unmount so returning to
// the page (or retaking the assessment) reads storage fresh.
let snapshot: SavedProgress | null | undefined;
const readSaved = () => (snapshot === undefined ? (snapshot = loadProgress()) : snapshot);
const subscribe = () => () => {};

/**
 * Server-renders a fresh assessment (fast first paint), then remounts with any
 * progress saved in localStorage once the browser snapshot is available.
 */
export function AssessmentLoader() {
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  useEffect(
    () => () => {
      snapshot = undefined;
    },
    [],
  );
  return <AssessmentFlow key={saved ? "restored" : "fresh"} saved={saved} />;
}
