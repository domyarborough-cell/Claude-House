"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** prefers-reduced-motion without pulling in an animation library. `false` on the server. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE_QUERY).matches, () => false);
}

/** True once the element has come within `margin` of the viewport (never resets). */
export function useInViewOnce<T extends Element>(margin = "0px"): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, seen]);
  return [ref, seen];
}

let capable: boolean | null = null;
function detect3D(): boolean {
  if (capable !== null) return capable;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const lowPower =
    (nav.hardwareConcurrency ?? 8) < 4 ||
    (nav.deviceMemory ?? 8) < 4 ||
    nav.connection?.saveData === true ||
    window.matchMedia("(max-width: 640px)").matches;
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {}
  capable = webgl && !lowPower;
  return capable;
}
const noopSubscribe = () => () => {};

/** Whether this device can comfortably run the WebGL hero. `null` during server render. */
export function useCanRender3D(): boolean | null {
  const reduce = usePrefersReducedMotion();
  const can = useSyncExternalStore<boolean | null>(noopSubscribe, detect3D, () => null);
  if (can === null) return null;
  return can && !reduce;
}

/**
 * Counts up to `target` once `start` is true; later changes animate from the
 * current value. Shows the value immediately when motion is reduced.
 */
export function useCountUp(target: number, start: boolean, durationMs = 1400): number {
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    if (!start || reduce) return;
    let frame = 0;
    const from = current.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      current.current = v;
      setValue(v);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, durationMs, reduce]);
  if (!start) return 0;
  return reduce ? target : value;
}
