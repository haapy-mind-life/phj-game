# Staged Single-Tap Adventure Design

## Goal

Evolve Park Runner into a child-friendly five-stage runner that is controlled by one interaction only: tapping/clicking the game surface. The game still clears at 1000 points, but every 200 points introduces a distinct play concept.

## Global UX Contract

- The only player-facing control is one tap/click on the game surface.
- No visible jump, gun, bow, banana, up, down, left, right, or grab buttons.
- The meaning of tap is contextual and deterministic.
- Weapons fire automatically; the player never selects a weapon manually.
- A run still ends at 1000 points.
- Money/coins are a separate collectible counter and do not directly increase progression score.
- No new runtime dependency is introduced.

## Stage Model

| Score | Stage | Core play |
| --- | --- | --- |
| 0-199 | Stage 1: 달리기 | Running, jumping, obstacles, springs |
| 200-399 | Stage 2: 몬스터 | Automatic combat plus jumping/avoidance |
| 400-599 | Stage 3: 비밀 사다리 | Ladders, climb/descend interaction, coin collection |
| 600-799 | Stage 4: 하늘 모험 | Flight item, permanent flight + invincibility, crane unlock after transformation |
| 800-999 | Stage 5: 챔피언 코스 | Permanent flight, invincibility, crane and airborne treasure collection |
| 1000+ | Clear | Run complete |

The existing 100-point level cadence remains an internal difficulty/speed input; the visible progression concept is the five-stage model above.

## Single-Tap State Machine

Tap is resolved in this priority order:

1. `ready`, `over`, or `clear` -> start/restart the run.
2. crane minigame active -> drop the moving claw.
3. ladder top waiting -> descend automatically.
4. ladder interaction ready -> climb automatically.
5. permanent flight active -> apply an upward flight impulse.
6. normal running -> jump.

This order prevents one tap from triggering two actions.

## Automatic Combat

From Stage 2 onward, nearby living enemies are targeted automatically. A short fire cooldown prevents projectile spam. Weapon selection follows the approved simple priority:

1. banana if available,
2. bow if available,
3. gun if available,
4. otherwise no shot.

Existing score values remain unchanged: gun +50, bow +80, banana +100.

## Stage 3: Ladder and Money

- Ladders only spawn while score is 400-599 and permanent flight has not been acquired.
- When a ladder reaches the interaction zone, the next tap starts an automatic climb animation.
- During climb/descend, horizontal runner progression pauses so the interaction cannot be missed.
- Reaching the top automatically collects a small cluster of coins and enters a `ladderTop` waiting state.
- The next tap starts automatic descent.
- After landing, the runner resumes.
- Coins increment a dedicated money counter and are shown in the HUD.

## Stage 4+: Flight Transformation

- At 600 points, if permanent flight has not been acquired, a special flight item begins spawning.
- Missing the item is not punitive: after it leaves the screen, it respawns after a short cooldown and continues doing so until collected.
- Collecting it triggers a visible transformation state and permanently sets `flying=true` for the current run.
- Permanent flight also means complete invincibility for the remainder of the run: enemy contact, ground obstacles, and rain hazards cannot end the run.
- Flight never expires before game over/clear/restart.
- After transformation, ladders stop spawning and existing unused ladders are removed.
- During flight, tap gives upward impulse; when not tapping, gravity slowly pulls the character down. Vertical bounds keep the character on screen.

## Crane Minigame

- Cranes unlock only after the flight transformation has been completed.
- A crane encounter automatically enters the crane minigame; no extra entry button is required.
- The claw moves left/right automatically.
- A tap drops the claw at its current horizontal position.
- A miss returns the claw to automatic movement and allows unlimited retries at no cost.
- A successful grab awards exactly one prize, closes the minigame, and returns to flying.
- Prize pool: banana pack, armor, coin bag, golden treasure. The flight item is never a crane prize.

## Visual/HUD Requirements

- Show `점수 / 1000`, current stage number/name, money count, and compact inventory state.
- Replace the existing row of action buttons with a single full game-surface interaction.
- Context hint text may change (`화면을 탭해서 점프`, `탭해서 사다리`, `탭해서 날기`, `탭해서 집게 내리기`) but it is not a separate control.
- Use child-friendly, non-graphic visuals.

## Code Boundaries

- `src/game/progression.ts`: pure stage, tap-action, automatic weapon-choice, and reward rules.
- `src/game/progression.test.ts`: boundary/state-machine tests.
- `src/game/types.ts`: shared ladder/coin/flight/crane state types and `flying` combat state.
- `src/game/combat.ts`: combat stays focused; flight is added as another invincible contact state.
- `src/game/combat.test.ts`: regression test for flight invincibility.
- `src/routes/index.tsx`: orchestration, spawn/update loops, Canvas drawing, contextual tap wiring, HUD.

## Acceptance Criteria

1. A run can be played from start to 1000 points using only taps/clicks on the game surface.
2. No player-facing weapon/directional action buttons remain.
3. Stage boundaries are exactly 0/200/400/600/800/1000.
4. Stage 3 ladders support tap-to-climb, automatic coin collection, tap-to-descend.
5. The flight item begins at 600+, respawns until collected, then grants permanent flight and complete invincibility.
6. Ladders cease after flight transformation.
7. Crane encounters begin only after transformation; the claw auto-sweeps, tap drops it, misses retry indefinitely, and one successful prize exits the minigame.
8. Existing gun/bow/banana scores and mystery-box behavior remain valid.
9. `npm test`, `npm run lint`, and `npm run build` succeed before completion.
