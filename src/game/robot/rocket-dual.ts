import { isRocketPair } from "./robot-catalog.ts";

// Rocket + Rocket X → Dual Rocket (docs/robot-fusion/2026-11-08-rocket-dual-v1/02). Pure rules
// only: the caller passes the time, so there is one clock and nothing here can fire twice.
// Nothing in this state is saved; a reload stands both robots up again (02 §3).

/** P-02 provisional: the whole fusion, shown as a countdown. */
export const DUAL_FUSION_MS = 10_000;
export type DualStep = "gather" | "link" | "assemble" | "reveal";
export type RocketDualPhase = "idle" | DualStep | "active";
export type DualMode = "robot" | "car";
/** Step start times: 준비 → 에너지 연결 → 합체 변형 → 완성 (P-03). */
export const DUAL_STEPS: readonly { step: DualStep; fromMs: number }[] = [
  { step: "gather", fromMs: 0 },
  { step: "link", fromMs: 2000 },
  { step: "assemble", fromMs: 4000 },
  { step: "reveal", fromMs: 7000 },
];
export type RocketDualState = {
  phase: RocketDualPhase;
  /** Ties a finished fusion to the start that began it. 0 at rest. */
  fusionId: number;
  startedAtMs: number | null;
  /** Furthest time reached, so a clock that jumps back never undoes a step. */
  elapsedMs: number;
  mode: DualMode;
};
export const idleDual = (): RocketDualState => ({
  phase: "idle",
  fusionId: 0,
  startedAtMs: null,
  elapsedMs: 0,
  mode: "robot",
});
export const isDualFusing = (s: RocketDualState) => s.phase !== "idle" && s.phase !== "active";

/** Which step a fusion is in after `elapsedMs`. Broken or negative times stay at the start. */
export function phaseAt(elapsedMs: number): DualStep | "active" {
  const t = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  if (t >= DUAL_FUSION_MS) return "active";
  let step: DualStep = "gather";
  for (const s of DUAL_STEPS) if (t >= s.fromMs) step = s.step;
  return step;
}

const reached = (startedAtMs: number, nowMs: number) =>
  Number.isFinite(nowMs) ? Math.max(0, nowMs - startedAtMs) : 0;

/** Starts from rest only, and only for Rocket + Rocket X. */
export function beginRocketFusion(
  s: RocketDualState,
  ids: readonly string[],
  nowMs: number,
  fusionId: number,
): RocketDualState | null {
  if (s.phase !== "idle" || !isRocketPair(ids) || !Number.isFinite(nowMs)) return null;
  return { phase: "gather", fusionId, startedAtMs: nowMs, elapsedMs: 0, mode: "robot" };
}

/** `completed` is true exactly once: on the advance that reaches the end. */
export function advanceRocketFusion(
  s: RocketDualState,
  nowMs: number,
): { state: RocketDualState; completed: boolean } {
  if (!isDualFusing(s) || s.startedAtMs === null) return { state: s, completed: false };
  const elapsedMs = Math.max(s.elapsedMs, reached(s.startedAtMs, nowMs));
  const phase = phaseAt(elapsedMs);
  if (phase === s.phase && elapsedMs === s.elapsedMs) return { state: s, completed: false };
  return { state: { ...s, phase, elapsedMs }, completed: phase === "active" };
}

/** Stops a fusion in progress. A finished Dual Rocket is split, not cancelled. */
export const cancelRocketFusion = (s: RocketDualState): RocketDualState =>
  isDualFusing(s) ? idleDual() : s;

/** Back to two robots, whether Dual Rocket stood as a robot or drove as the dual car. */
export const splitRocketFusion = (_s: RocketDualState): RocketDualState => idleDual();

/** Only a finished Dual Rocket changes between robot and car. Null when nothing changes. */
export function setDualMode(s: RocketDualState, mode: DualMode): RocketDualState | null {
  if (s.phase !== "active" || s.mode === mode) return null;
  return { ...s, mode };
}

/** Whole seconds left on the countdown; 0 at rest or when done. */
export function secondsLeft(s: RocketDualState, nowMs: number): number {
  if (!isDualFusing(s) || s.startedAtMs === null) return 0;
  const t = Math.max(s.elapsedMs, reached(s.startedAtMs, nowMs));
  return Math.max(0, Math.ceil((DUAL_FUSION_MS - t) / 1000));
}
