/**
 * Scene data for the Kestrel journey. The single continuous film was cut
 * into four consecutive, frame-exact clips (frames 0-71, 72-143, 144-215,
 * 216-288), one per chapter, so the scrub stays seamless while each chapter
 * owns its stretch of the move. Every poster is the first frame of its
 * encoded clip.
 */
import type {
  ScrollScrubScene,
  ScrollScrubTheme,
} from "@/components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#2b45d4",
  background: "#e9eceb",
  ink: "#14181a",
  muted: "#4a5257",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    align: "left",
    body: "Merchants, memos, missing receipts. A year of company card spend arrives as 50,000 loose slips.",
    clip: "/kestrel-spend/world/scene-01.mp4",
    id: "paper",
    kicker: "Kestrel spend console",
    label: "Paper",
    mobileClip: "/kestrel-spend/world/scene-01-mobile.mp4",
    mobilePoster: "/kestrel-spend/world/scene-01-mobile-poster.png",
    poster: "/kestrel-spend/world/scene-01-poster.png",
    scroll: 1.3,
    title: "Every swipe leaves paper.",
  },
  {
    align: "right",
    body: "A hand-rolled virtualized ledger that filters, sorts and totals in a Web Worker, so typing never stutters the scroll.",
    clip: "/kestrel-spend/world/scene-02.mp4",
    id: "read",
    label: "Read",
    mobileClip: "/kestrel-spend/world/scene-02-mobile.mp4",
    mobilePoster: "/kestrel-spend/world/scene-02-mobile-poster.png",
    poster: "/kestrel-spend/world/scene-02-poster.png",
    scroll: 1.3,
    tags: ["Web Worker", "Typed arrays", "Virtualized grid"],
    title: "Read 50,000 rows like one.",
  },
  {
    align: "left",
    body: "Select a range, recategorize in one keystroke, undo anything. Every edit lands in an append-only log.",
    clip: "/kestrel-spend/world/scene-03.mp4",
    id: "fix",
    label: "Fix",
    mobileClip: "/kestrel-spend/world/scene-03-mobile.mp4",
    mobilePoster: "/kestrel-spend/world/scene-03-mobile-poster.png",
    poster: "/kestrel-spend/world/scene-03-poster.png",
    scroll: 1.3,
    tags: ["Optimistic edits", "Unlimited undo", "Event log"],
    title: "Fix a hundred lines at once.",
  },
  {
    align: "right",
    body: "Budgets burn down live as you clean the ledger. Open the console and drive it from your keyboard.",
    clip: "/kestrel-spend/world/scene-04.mp4",
    id: "settle",
    label: "Settle",
    mobileClip: "/kestrel-spend/world/scene-04-mobile.mp4",
    mobilePoster: "/kestrel-spend/world/scene-04-mobile-poster.png",
    poster: "/kestrel-spend/world/scene-04-poster.png",
    scroll: 1.5,
    title: "Spend, squared away.",
  },
];
