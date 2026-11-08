# Staged Single-Tap Adventure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved five-stage, single-tap Park Runner flow through 1000 points, including automatic combat, ladder/coin play, permanent flying invincibility, and a one-tap crane minigame.

**Architecture:** Keep pure game decisions outside React/Canvas in `src/game/progression.ts` and extend the existing combat module only for flight invincibility. `src/routes/index.tsx` remains the runtime/rendering orchestrator but delegates stage, tap, weapon, and crane-reward decisions to pure helpers so boundary behavior is unit-testable.

**Tech Stack:** React 19, TypeScript, TanStack Start, Canvas 2D, Node built-in test runner, ESLint, Vite.

**Spec:** `docs/superpowers/specs/2026-09-06-staged-single-tap-adventure-design.md`

## Global Constraints

- Player-facing interaction is tap/click only.
- Clear threshold remains exactly 1000 points.
- Stage thresholds are exactly 0, 200, 400, 600, 800, 1000.
- Flight acquired at 600+ is permanent and fully invincible until run reset.
- Flight item respawns until collected.
- Cranes unlock only after flight transformation.
- Crane misses retry without cost; one successful prize exits.
- No force push, rebase, amend, or squash of published commits.
- No new runtime dependency.

---

### Task 1: Pure progression and tap rules

**Files:**
- Create: `src/game/progression.ts`
- Create: `src/game/progression.test.ts`

**Interfaces:**
- Produces: `stageForScore(score)`, `resolveTapAction(context)`, `chooseAutoWeapon(state)`, `applyCraneReward(state, reward)`.
- Consumes: existing `PlayerCombatState` and `WeaponKind` from `src/game/types.ts`.

- [ ] **Step 1: Write failing boundary/state tests**

Cover exact stage boundaries (0/199/200/399/400/599/600/799/800/999/1000), tap priority (crane > ladder top > ladder ready > flying > jump), automatic weapon priority (banana > bow > gun > null), and crane reward mutations.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`
Expected: FAIL because `progression.ts` exports do not exist.

- [ ] **Step 3: Implement minimal pure rules**

Use explicit stage descriptors and discriminated tap action strings. Clamp negative scores to Stage 1 and return clear state for `score >= 1000`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`
Expected: all progression tests plus existing combat tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add staged progression and single-tap rules`

---

### Task 2: Extend shared types and flight invincibility

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/combat.ts`
- Modify: `src/game/combat.test.ts`

**Interfaces:**
- Adds `flying: boolean` to `PlayerCombatState`.
- Adds runtime types for `Ladder`, `FlightItem`, and `CraneEncounter`.
- `resolveEnemyContact(state)` treats `flying` as invincible without consuming armor.

- [ ] **Step 1: Add failing combat test**

Add a test asserting `flying: true` survives enemy contact, consumes the enemy, and preserves armor.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`
Expected: FAIL until `flying` is implemented.

- [ ] **Step 3: Add types and minimal combat change**

Update every test fixture/state construction with `flying: false`; add `state.flying` to the invincible branch.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add permanent flight state`

---

### Task 3: Convert runtime to contextual single-tap + automatic combat

**Files:**
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes `stageForScore`, `resolveTapAction`, `chooseAutoWeapon`.
- Replaces visible weapon controls and weapon keyboard handlers with one game-surface tap handler.

- [ ] **Step 1: Add tap routing in runtime**

Create one `handleTap()` callback. It starts/restarts outside play; during play it asks `resolveTapAction` and performs exactly one contextual action.

- [ ] **Step 2: Remove manual combat controls**

Delete X/C/B weapon key handling and the four-button control row. Preserve canvas click/tap as the sole visible interaction.

- [ ] **Step 3: Add automatic targeting/fire cooldown**

From Stage 2 onward, if a living enemy is within a bounded forward range and cooldown is zero, use `chooseAutoWeapon` and existing `fireProjectile`. Reset cooldown after a successful shot.

- [ ] **Step 4: Preserve regression behavior**

Keep current projectile scoring, mystery boxes, mushrooms, best score, speed progression, and 1000-point clear logic.

- [ ] **Step 5: Run full checks**

Run: `npm test && npm run lint && npm run build`
Expected: success (existing non-error lint warnings are acceptable).

- [ ] **Step 6: Commit**

Commit message: `feat: switch runner to single-tap auto combat`

---

### Task 4: Stage 3 ladder and money loop

**Files:**
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Runtime states: `ladderReady`, `climbingUp`, `ladderTop`, `climbingDown`.
- Money is a run-local integer independent of score.

- [ ] **Step 1: Add Stage 3 ladder spawning**

Spawn ladders only for score 400-599 while not flying. Maintain enough spacing so one encounter is readable.

- [ ] **Step 2: Add contextual climb transitions**

When ladder enters the interaction zone, tap starts automatic upward movement. Pause horizontal world motion during climb/top/descent.

- [ ] **Step 3: Add automatic coin collection**

On first arrival at ladder top, increment money by a fixed small cluster and show/update HUD once; do not add score.

- [ ] **Step 4: Add tap-to-descend and resume**

At `ladderTop`, next tap starts automatic descent. On ground, remove the used ladder and resume running.

- [ ] **Step 5: Render ladder/top coins and contextual hint**

Draw a simple child-friendly ladder and coin cluster. Hint text is descriptive only, never a button.

- [ ] **Step 6: Run full checks and commit**

Run: `npm test && npm run lint && npm run build`
Commit message: `feat: add ladder coin bonus stage`

---

### Task 5: Permanent flight item and invincible flight physics

**Files:**
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Runtime `flying` flag mirrors combat state.
- Flight item is retried until collected for score >=600.
- Tap in flight applies one upward impulse; gravity handles descent.

- [ ] **Step 1: Spawn/retry flight item at Stage 4**

When score is at least 600 and `flying=false`, ensure one flight item is periodically spawned. If it leaves screen uncollected, start a short respawn cooldown.

- [ ] **Step 2: Transform on collision**

On pickup set `flying=true`, remove flight item, clear ladders, cancel ladder interaction state, and display a short transformation flash.

- [ ] **Step 3: Implement permanent flight physics**

While flying, tap gives upward velocity; otherwise gentle gravity applies. Clamp character position to top and ground bounds. Do not expire flight.

- [ ] **Step 4: Apply full invincibility**

Ground obstacle and rain-cloud fatal checks become non-fatal while flying. Enemy contact passes `flying=true` into `resolveEnemyContact`.

- [ ] **Step 5: Update visuals/HUD**

Render the special flight item and persistent flight aura/status. Replace Stage 3 ladder hint with flight hint after transformation.

- [ ] **Step 6: Run full checks and commit**

Run: `npm test && npm run lint && npm run build`
Commit message: `feat: add permanent invincible flight transformation`

---

### Task 6: One-tap crane minigame after transformation

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/game/progression.test.ts` if reward edge coverage needs expansion

**Interfaces:**
- Crane is eligible only when `flying=true` and score >=600.
- `resolveTapAction({ craneActive: true, ... })` returns grab action.
- `applyCraneReward` mutates bananas/armor/money according to prize.

- [ ] **Step 1: Add crane encounter spawn/entry**

Spawn well-spaced crane stations during flight. Enter minigame automatically on encounter and pause runner-world progression.

- [ ] **Step 2: Add auto-sweeping claw**

Move the claw horizontally between fixed bounds and reverse direction at each edge.

- [ ] **Step 3: Add one-tap grab attempt**

Tap drops the claw. A hit on a prize succeeds; a miss retracts and restarts sweep with unlimited retries and no cost.

- [ ] **Step 4: Award exactly one prize and exit**

On success choose/render the prize, call `applyCraneReward`, close crane mode, remove the encounter, and return to flight.

- [ ] **Step 5: Render clear crane scene and hint**

Use simple claw/prize shapes and the text `탭해서 잡기!`; no left/right/grab buttons.

- [ ] **Step 6: Run full checks and commit**

Run: `npm test && npm run lint && npm run build`
Commit message: `feat: add one-tap crane prize game`

---

### Task 7: Final stage HUD, cleanup, and end-to-end verification

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `.github/workflows/combat-ci.yml` only if the feature branch/main trigger does not cover final verification.

**Interfaces:**
- Visible HUD presents stage name and money with compact inventory/status.
- No visible action buttons remain anywhere.

- [ ] **Step 1: Finalize Stage 1-5 messaging**

Use the exact five score bands from the spec and a clear 1000-point completion state.

- [ ] **Step 2: Verify reset semantics**

Restart must clear money, flight, flight item cooldown, ladder state, crane state, transformation flash, auto-fire cooldown, and all runtime encounter arrays.

- [ ] **Step 3: Fresh exact-tree verification**

Run: `npm test`
Run: `npm run lint`
Run: `npm run build`
Expected: all commands succeed.

- [ ] **Step 4: Review diff for scope and history safety**

Confirm only intended docs/game/workflow files changed; no force/rebase/amend/squash operations were used.

- [ ] **Step 5: Open PR to `main`**

PR title: `feat: add staged single-tap adventure`
Include stage model, single-tap contract, flight/crane rules, and exact verification evidence.
