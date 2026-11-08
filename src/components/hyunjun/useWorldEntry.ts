import { useCallback, useEffect, useReducer, useState, type ComponentType } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useGame } from "@/lib/game-state";
import {
  initialEntry,
  LOADING_MIN_MS,
  LOADING_TIMEOUT_MS,
  reduceEntry,
} from "@/game/world/world-entry";

// In-memory only, never saved: a reload or a new visit at the root shows the title again.
// Changed only from effects and the start button, never during render, so the server
// (whose module state is shared by every request) always renders the title.
let titlePassed = false;
const RETRY_KEY = "phj-world-entry-retry";

let villageComponent: ComponentType | null = null;
let villageLoading: Promise<ComponentType> | null = null;

/** The real world load: the world screen's code, fetched only when the child starts. */
function loadVillage() {
  villageLoading ??= import("./Village").then(
    (m) => (villageComponent = m.Village),
    (error: unknown) => {
      villageLoading = null; // let "다시 가기" fetch it again
      throw error;
    },
  );
  return villageLoading;
}

/**
 * Call once in each router's root component. A run that starts on another route
 * (`#/race`, `/kart`, …) never shows the title when the child later walks into the world.
 */
export function useMarkEntryRoute() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (path !== "/") titlePassed = true;
  }, [path]);
}

export function useWorldEntry() {
  const { ready } = useGame();
  const [state, send] = useReducer(reduceEntry, undefined, () =>
    initialEntry(titlePassed, villageComponent !== null),
  );
  // Coming back from a mini game: the loading card shows without the title heading,
  // so it never looks like the start screen came back.
  const [returning] = useState(() => titlePassed);
  const [loadedAttempt, setLoadedAttempt] = useState(0);
  const { phase, attempt, minShown } = state;

  useEffect(() => {
    if (phase !== "loading") return;
    let live = true;
    const timers = [window.setTimeout(() => send({ type: "failed", attempt }), LOADING_TIMEOUT_MS)];
    // Presentation only: keeps the spinner from flashing. Success still needs the real load.
    if (!minShown)
      timers.push(window.setTimeout(() => send({ type: "minShown", attempt }), LOADING_MIN_MS));
    loadVillage().then(
      () => live && setLoadedAttempt(attempt),
      () => live && send({ type: "failed", attempt }),
    );
    return () => {
      live = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [phase, attempt, minShown]);

  // The save store reads localStorage when first subscribed; both must be ready.
  useEffect(() => {
    if (ready && loadedAttempt > 0) send({ type: "worldReady", attempt: loadedAttempt });
  }, [ready, loadedAttempt]);

  useEffect(() => {
    if (phase === "world") titlePassed = true;
  }, [phase]);

  // After "다시 가기" reloads the page, go straight back to loading instead of the title.
  useEffect(() => {
    let resume = false;
    try {
      resume = window.sessionStorage.getItem(RETRY_KEY) === "1";
      window.sessionStorage.removeItem(RETRY_KEY);
    } catch {
      /* without session storage the retry simply shows the title again */
    }
    if (resume) send({ type: "start" });
  }, []);

  const start = useCallback(() => send({ type: "start" }), []);
  // Browsers remember a failed module fetch for the life of the page, so a real
  // retry needs a fresh page. The one-shot flag is not part of the game save.
  const retry = useCallback(() => {
    try {
      window.sessionStorage.setItem(RETRY_KEY, "1");
    } catch {
      /* the reload still retries; the child presses start once more */
    }
    window.location.reload();
  }, []);
  return { phase, returning, start, retry, World: phase === "world" ? villageComponent : null };
}
