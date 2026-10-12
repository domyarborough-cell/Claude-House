import type { IconId } from "./content";

/** Shape data for the section icon set, shared by the web icons and the PDF. 24px grid. */
export type IconShape =
  | ["path", { d: string }]
  | ["circle", { cx: number; cy: number; r: number }]
  | ["rect", { x: number; y: number; width: number; height: number; rx?: number }]
  | ["polyline", { points: string }];

export const ICON_SHAPES: Record<IconId, IconShape[]> = {
  shield: [
    ["path", { d: "M12 3l7.5 3v5.5c0 4.4-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5.1-7.5-9.5V6L12 3z" }],
    ["rect", { x: 9, y: 11, width: 6, height: 5, rx: 1 }],
    ["path", { d: "M10 11V9.5a2 2 0 014 0V11" }],
  ],
  nodes: [
    ["circle", { cx: 12, cy: 12, r: 2.5 }],
    ["circle", { cx: 5, cy: 6, r: 2 }],
    ["circle", { cx: 19, cy: 6, r: 2 }],
    ["circle", { cx: 5, cy: 18, r: 2 }],
    ["circle", { cx: 19, cy: 18, r: 2 }],
    ["path", { d: "M6.6 7.3l3.4 3M17.4 7.3l-3.4 3M6.6 16.7l3.4-3M17.4 16.7l-3.4-3" }],
  ],
  inbox: [
    ["path", { d: "M3.5 13.5l2.7-7.2A2 2 0 018.1 5h7.8a2 2 0 011.9 1.3l2.7 7.2V18a2 2 0 01-2 2h-13a2 2 0 01-2-2v-4.5z" }],
    ["path", { d: "M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" }],
    ["polyline", { points: "9.5,9.5 11.3,11.2 14.5,8" }],
  ],
  clipboard: [
    ["rect", { x: 5, y: 4.5, width: 11, height: 16, rx: 2 }],
    ["path", { d: "M8.5 4.5V3.5h4v1" }],
    ["path", { d: "M8 9h5M8 12h3" }],
    ["path", { d: "M16 13v2.5a2.5 2.5 0 005 0V13" }],
    ["circle", { cx: 18.5, cy: 19.5, r: 1.5 }],
    ["path", { d: "M18.5 18v-0.5" }],
  ],
  careplan: [
    ["path", { d: "M6 3h8l4 4v14H6z" }],
    ["path", { d: "M14 3v4h4" }],
    ["path", { d: "M9 12h6M12 9v6" }],
    ["path", { d: "M9 18h6" }],
  ],
  calendar: [
    ["rect", { x: 3.5, y: 5, width: 14, height: 14, rx: 2 }],
    ["path", { d: "M3.5 9.5h14M7.5 3v4M13.5 3v4" }],
    ["path", { d: "M18 12.5a2.8 2.8 0 012.8 2.8c0 2.1-2.8 5.2-2.8 5.2s-2.8-3.1-2.8-5.2a2.8 2.8 0 012.8-2.8z" }],
    ["circle", { cx: 18, cy: 15.3, r: 0.9 }],
  ],
  dollar: [
    ["path", { d: "M5 3h10l4 4v14H5z" }],
    ["path", { d: "M15 3v4h4" }],
    ["path", { d: "M14 10.5c-.4-.9-1.2-1.5-2.3-1.5-1.3 0-2.2.7-2.2 1.7 0 2.4 4.8 1.2 4.8 3.7 0 1-1 1.8-2.4 1.8-1.2 0-2.1-.6-2.5-1.5" }],
    ["path", { d: "M11.8 7.5V9M11.8 16.2v1.3" }],
  ],
  badge: [
    ["path", { d: "M12 2.8l2.3 1.7 2.8-.2.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.2L12 19.6l-2.3-1.7-2.8.2-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.2z" }],
    ["polyline", { points: "8.8,11.4 11,13.6 15.4,9.2" }],
  ],
  chart: [
    ["path", { d: "M4 4v16h16" }],
    ["rect", { x: 7, y: 12, width: 3, height: 5, rx: 0.6 }],
    ["rect", { x: 12, y: 8, width: 3, height: 9, rx: 0.6 }],
    ["rect", { x: 17, y: 5, width: 3, height: 12, rx: 0.6 }],
  ],
  sliders: [
    ["path", { d: "M5 4v16M12 4v16M19 4v16" }],
    ["circle", { cx: 5, cy: 14, r: 2.2 }],
    ["circle", { cx: 12, cy: 8, r: 2.2 }],
    ["circle", { cx: 19, cy: 16, r: 2.2 }],
  ],
  headset: [
    ["path", { d: "M4 14v-2a8 8 0 0116 0v2" }],
    ["rect", { x: 3.5, y: 13, width: 4, height: 6, rx: 1.5 }],
    ["rect", { x: 16.5, y: 13, width: 4, height: 6, rx: 1.5 }],
    ["path", { d: "M18.5 19c0 1.4-2.2 2.2-5 2.2" }],
  ],
  heartclock: [
    ["path", { d: "M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 1.2-.3 2.3-.9 3.3" }],
    ["circle", { cx: 17, cy: 17, r: 4 }],
    ["path", { d: "M17 15v2.2l1.4.9" }],
  ],
};
