import { isWalkable, type Point } from "./adventure.ts";
import type { Weapon } from "./robot-catalog.ts";
import { worldDelta, worldDistance, wrapPoint } from "./world-space.ts";

// Giant battles (requirements v3 RA-106/107): a giant villain and small minions that live at
// real places, move, fight back and retreat for repairs. Made-up "rusty gear empire" robots;
// nobody is hurt and losing costs nothing.
export const BOSS_ARENA = { x: 1000, y: 3550 };
export const BOSS_LEASH = 380;
export const BOSS_HP = 120;
export const BOSS_SHIELD = 40;
export const BOSS_SPEED = 90;
/** The boss notices the giant from this far away. */
export const BOSS_SIGHT = 760;
export const TELEGRAPH_MS = 1600;
export const ATTACK_MS = 700;
export const STAGGER_MS = 900;
export const BOSS_RETREAT_MS = 20000;
/** Standing inside the warning circle when the slam lands is a hit; stepping out dodges it. */
export const BLAST_RADIUS = 170;
export const BOSS_DAMAGE = 25;
export const GIANT_HP = 100;
/** The giant's arm cannon. Giant hits don't count toward card uses (PROPOSED). */
export const GIANT_WEAPON: Weapon = {
  name: "거대 빔",
  kind: "cannon",
  range: 460,
  cooldownMs: 900,
};
export const GIANT_DAMAGE = 10;
export const GIANT_SPEED = 1.1;
export const MINION_CAMP = { x: 2700, y: 3500 };
export const MINION_COUNT = 5;
export const MINION_HP = 3;
export const MINION_RESPAWN_MS = 10000;

export type BossPhase = "idle" | "approach" | "telegraph" | "attack" | "stagger" | "retreat";
export type Boss = {
  phase: BossPhase;
  hp: number;
  shield: number;
  pos: Point;
  /** Where the next slam lands (shown as a warning circle). */
  target: Point | null;
  until: number;
};
export const freshBoss = (): Boss => ({
  phase: "idle",
  hp: BOSS_HP,
  shield: BOSS_SHIELD,
  pos: { ...BOSS_ARENA },
  target: null,
  until: 0,
});
/**
 * One boss step. It walks toward the giant inside its arena, raises its arms over a warning
 * circle, then slams: only a giant still inside the circle takes damage.
 */
export function stepBoss(b: Boss, giant: Point | null, now: number, dt: number) {
  const hit = (boss: Boss, damage = 0) => ({ boss, giantDamage: damage });
  if (b.phase === "retreat") return hit(now >= b.until ? freshBoss() : b);
  if (b.phase === "stagger") return hit(now >= b.until ? { ...b, phase: "approach" } : b);
  if (b.phase === "attack")
    return hit(now >= b.until ? { ...b, phase: "approach", target: null } : b);
  if (b.phase === "telegraph") {
    if (now < b.until) return hit(b);
    const caught = !!giant && !!b.target && worldDistance(giant, b.target) <= BLAST_RADIUS;
    return hit({ ...b, phase: "attack", until: now + ATTACK_MS }, caught ? BOSS_DAMAGE : 0);
  }
  if (!giant || worldDistance(giant, b.pos) > BOSS_SIGHT) return hit({ ...b, phase: "idle" });
  if (b.phase === "idle") return hit({ ...b, phase: "approach", until: now + 2500 });
  // approach: close in, then wind up a slam where the giant is standing now.
  const d = worldDelta(b.pos, giant);
  const len = Math.hypot(d.x, d.y);
  if (len < 240 || now >= b.until)
    return hit({ ...b, phase: "telegraph", target: { ...giant }, until: now + TELEGRAPH_MS });
  const step = Math.min(len, BOSS_SPEED * Math.min(dt, 0.1));
  const next = wrapPoint({ x: b.pos.x + (d.x / len) * step, y: b.pos.y + (d.y / len) * step });
  return hit(
    isWalkable(next) && worldDistance(next, BOSS_ARENA) <= BOSS_LEASH ? { ...b, pos: next } : b,
  );
}
/** The shield soaks up hits first; big hits make the boss stagger; at 0 it retreats. */
export function hitBoss(b: Boss, damage: number, now: number) {
  if (b.phase === "retreat") return { boss: b, defeated: false };
  const soak = Math.min(b.shield, damage);
  const shield = b.shield - soak;
  const hp = Math.max(0, b.hp - (damage - soak));
  if (hp === 0)
    return {
      boss: {
        ...b,
        shield,
        hp,
        phase: "retreat" as const,
        target: null,
        until: now + BOSS_RETREAT_MS,
      },
      defeated: true,
    };
  const stagger = shield === 0 && damage >= GIANT_DAMAGE && b.phase !== "telegraph";
  return {
    boss: stagger
      ? { ...b, shield, hp, phase: "stagger" as const, target: null, until: now + STAGGER_MS }
      : { ...b, shield, hp },
    defeated: false,
  };
}

export type Minion = { id: string; hp: number; phase: "active" | "retreat" };
export type MinionWave = { wave: number; minions: Minion[]; clearedAt: number };
export const freshWave = (wave: number): MinionWave => ({
  wave,
  minions: Array.from({ length: MINION_COUNT }, (_, i) => ({
    id: `minion-${wave}-${i}`,
    hp: MINION_HP,
    phase: "active",
  })),
  clearedAt: 0,
});
/** Minions scurry in little circles around their camp. */
export function minionPosition(index: number, seconds: number): Point {
  const a = seconds * 0.6 + index * ((Math.PI * 2) / MINION_COUNT);
  const r = 110 + (index % 2) * 50;
  return wrapPoint({
    x: MINION_CAMP.x + Math.cos(a) * r,
    y: MINION_CAMP.y + Math.sin(a) * r * 0.7,
  });
}
export function hitMinion(w: MinionWave, id: string, damage: number, now: number) {
  const minions = w.minions.map((m) =>
    m.id === id && m.phase === "active"
      ? {
          ...m,
          hp: Math.max(0, m.hp - damage),
          phase: m.hp - damage <= 0 ? ("retreat" as const) : m.phase,
        }
      : m,
  );
  const cleared = w.clearedAt === 0 && minions.every((m) => m.phase === "retreat");
  return { wave: { ...w, minions, clearedAt: cleared ? now : w.clearedAt }, cleared };
}
