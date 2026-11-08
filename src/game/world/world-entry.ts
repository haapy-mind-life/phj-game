// Title → loading → world gate shown when the app starts at the root route.
// Pure rules only; the screen and the actual world loading live in
// src/components/hyunjun/WorldEntry.tsx and useWorldEntry.ts.

export type EntryPhase = "title" | "loading" | "failed" | "world";

export type EntryState = {
  phase: EntryPhase;
  /** Bumped on every start so a late result from an older attempt is ignored. */
  attempt: number;
  /** The world code and save are really loaded for this attempt. */
  worldReady: boolean;
  /** The short minimum display time has passed (presentation only, never a success signal). */
  minShown: boolean;
};

export type EntryEvent =
  | { type: "start" }
  | { type: "worldReady"; attempt: number }
  | { type: "minShown"; attempt: number }
  | { type: "failed"; attempt: number };

/**
 * Presentation-only minimum time for the spinner, so the loading screen does not
 * flash. The world opens only after the real load has succeeded *and* this has passed.
 */
export const LOADING_MIN_MS = 600;
/**
 * A load that has not finished by then is treated as failed. The retry button reloads
 * the page (a browser keeps a failed module fetch for the page's lifetime) and the
 * screen resumes at loading.
 */
export const LOADING_TIMEOUT_MS = 12_000;

/**
 * `passed`: the title was already passed in this app run, or the run started on
 * another route (e.g. `#/race`), so coming back to the world never shows the title.
 * `worldLoaded`: the world code is already in memory.
 */
export function initialEntry(passed: boolean, worldLoaded: boolean): EntryState {
  if (!passed) return { phase: "title", attempt: 0, worldReady: false, minShown: false };
  if (worldLoaded) return { phase: "world", attempt: 0, worldReady: true, minShown: true };
  // Returning without the world loaded yet: load it, but add no extra waiting time.
  return { phase: "loading", attempt: 1, worldReady: false, minShown: true };
}

const settle = (s: EntryState): EntryState =>
  s.phase === "loading" && s.worldReady && s.minShown ? { ...s, phase: "world" } : s;

export function reduceEntry(s: EntryState, e: EntryEvent): EntryState {
  switch (e.type) {
    case "start":
      // A second tap while loading (or later) does nothing.
      return s.phase === "title"
        ? { phase: "loading", attempt: s.attempt + 1, worldReady: false, minShown: false }
        : s;
    case "worldReady":
      return s.phase === "loading" && e.attempt === s.attempt
        ? settle({ ...s, worldReady: true })
        : s;
    case "minShown":
      return s.phase === "loading" && e.attempt === s.attempt
        ? settle({ ...s, minShown: true })
        : s;
    case "failed":
      return s.phase === "loading" && e.attempt === s.attempt ? { ...s, phase: "failed" } : s;
  }
}
