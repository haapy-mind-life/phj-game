import type { CombatHitResult, Enemy, PlayerCombatState, Projectile, WeaponKind } from "./types.ts";

export const GUN_SCORE = 50;
export const BOW_SCORE = 80;
export const BANANA_SCORE = 100;
export const GIANT_FRAMES = 480;

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function fireProjectile(
  state: PlayerCombatState,
  weapon: WeaponKind,
  x: number,
  y: number,
): { state: PlayerCombatState; projectile: Projectile | null } {
  const next = { ...state };
  if (weapon === "gun") {
    if (next.bullets <= 0) return { state: next, projectile: null };
    next.bullets -= 1;
    return {
      state: next,
      projectile: { id: 0, weapon, x, y, vx: 14, w: 12, h: 5 },
    };
  }

  if (weapon === "bow") {
    if (next.arrows <= 0) return { state: next, projectile: null };
    next.arrows -= 1;
    return {
      state: next,
      projectile: { id: 0, weapon, x, y, vx: 10, w: 22, h: 6 },
    };
  }

  if (next.bananas <= 0) return { state: next, projectile: null };
  next.bananas -= 1;
  return {
    state: next,
    projectile: { id: 0, weapon, x, y, vx: 11, w: 20, h: 14 },
  };
}

export function resolveProjectileHits(
  enemies: Enemy[],
  projectiles: Projectile[],
): CombatHitResult {
  const killed = new Set<number>();
  const consumed = new Set<number>();
  let scoreDelta = 0;

  for (const projectile of projectiles) {
    const target = enemies.find(
      (enemy) => enemy.alive && !killed.has(enemy.id) && overlaps(projectile, enemy),
    );
    if (!target) continue;
    killed.add(target.id);
    consumed.add(projectile.id);
    scoreDelta +=
      projectile.weapon === "gun"
        ? GUN_SCORE
        : projectile.weapon === "bow"
          ? BOW_SCORE
          : BANANA_SCORE;
  }

  return {
    enemies: enemies.filter((enemy) => enemy.alive && !killed.has(enemy.id)),
    projectiles: projectiles.filter((projectile) => !consumed.has(projectile.id)),
    scoreDelta,
  };
}

export function resolveEnemyContact(state: PlayerCombatState): {
  state: PlayerCombatState;
  survives: boolean;
  consumeEnemy: boolean;
} {
  if (state.disguised || state.flying || state.giantTimer > 0) {
    return { state: { ...state }, survives: true, consumeEnemy: true };
  }
  if (state.armor > 0) {
    return {
      state: { ...state, armor: state.armor - 1 },
      survives: true,
      consumeEnemy: true,
    };
  }
  return { state: { ...state }, survives: false, consumeEnemy: false };
}

export function activateMushroom(state: PlayerCombatState): PlayerCombatState {
  return { ...state, giantTimer: GIANT_FRAMES };
}

export function openMysteryBox(state: PlayerCombatState): PlayerCombatState {
  return {
    ...state,
    disguised: true,
    bananas: state.bananas + 5,
  };
}
