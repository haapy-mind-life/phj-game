import { canWalkHome } from "./life-world.ts";
import type { Point } from "./adventure.ts";
import { isWalkable } from "./adventure.ts";
import { wrapPoint, worldDistance, isOcean } from "./world-space.ts";
export type ActivityKind = "home" | "sea" | "festival";
export type Activity = {
  id: string;
  kind: ActivityKind;
  time: number;
  elapsed: number;
  items: (Point & { id: number; found: boolean })[];
  score: number;
  playerScore: number;
  helped: number;
  nextHelp: number;
  helper: Point | null;
  helperTarget: number | null;
  ink: number;
  inkAt: number;
  done: boolean;
  won: boolean;
};
export function newActivity(kind: ActivityKind, origin: Point, id: string): Activity {
  const offsets =
    kind === "home"
      ? [
          { x: 0, y: -280 },
          { x: -180, y: -350 },
          { x: -350, y: -300 },
          { x: -180, y: -350 },
          { x: 0, y: -280 },
        ]
      : [
          { x: -170, y: -130 },
          { x: 150, y: -100 },
          { x: 230, y: 160 },
          { x: -160, y: 180 },
          { x: 0, y: 300 },
        ];
  return {
    id,
    kind,
    time: kind === "festival" ? 75 : 60,
    elapsed: 0,
    items: offsets.map((o, i) => {
      let p =
        kind === "home"
          ? [
              { x: 1110, y: 500 },
              { x: 920, y: 450 },
              { x: 650, y: 450 },
              { x: 920, y: 450 },
              { x: 1110, y: 500 },
            ][i]!
          : wrapPoint({ x: origin.x + o.x, y: origin.y + o.y });
      if (kind === "sea") p.x = Math.max(7440, Math.min(10100, p.x));
      if (kind === "festival" && !isWalkable(p)) p = origin;
      return { ...p, id: i, found: false };
    }),
    score: 0,
    playerScore: 0,
    helped: 0,
    nextHelp: 8,
    helper: null,
    helperTarget: null,
    ink: 0,
    inkAt: 7,
    done: false,
    won: false,
  };
}
export function tickActivity(
  a: Activity,
  dt: number,
  player: Point,
  companions: number,
  houseTier = 4,
) {
  if (a.done) return a;
  const next = {
    ...a,
    items: a.items.map((i) => ({ ...i })),
    time: Math.max(0, a.time - dt),
    elapsed: a.elapsed + dt,
    ink: Math.max(0, a.ink - dt),
  };
  if (next.kind === "sea" && next.elapsed >= next.inkAt) {
    next.ink = 2;
    next.inkAt += 9;
  }
  if (
    next.kind !== "sea" &&
    companions > 0 &&
    next.playerScore > 0 &&
    next.helped < 2 &&
    next.helperTarget === null &&
    next.elapsed >= next.nextHelp
  ) {
    next.nextHelp = next.elapsed + 8;
    const item = next.items.find(
      (i) =>
        !i.found &&
        (next.kind === "home"
          ? Math.hypot(i.x - player.x, i.y - player.y)
          : worldDistance(i, player)) < 200,
    );
    if (item) {
      next.helper = { ...player };
      next.helperTarget = item.id;
    }
  } else if (next.helper && next.helperTarget !== null) {
    const target = next.items.find((i) => i.id === next.helperTarget);
    if (!target || target.found) {
      next.helperTarget = null;
      next.helper = null;
    } else {
      const dx = target.x - next.helper.x,
        dy = target.y - next.helper.y,
        len = Math.hypot(dx, dy);
      if (len < 24) {
        target.found = true;
        next.score++;
        next.helped++;
        next.helperTarget = null;
      } else {
        const p = {
          x: next.helper.x + (dx / len) * 160 * dt,
          y: next.helper.y + (dy / len) * 160 * dt,
        };
        if (next.kind === "home" ? canWalkHome(p, houseTier) : isWalkable(p)) next.helper = p;
        else {
          next.helperTarget = null;
          next.helper = null;
        }
      }
    }
  } else if (next.helper && next.helperTarget === null) {
    const dx = player.x - next.helper.x,
      dy = player.y - next.helper.y,
      len = Math.hypot(dx, dy);
    if (len < 50) next.helper = null;
    else {
      const p = {
        x: next.helper.x + (dx / len) * 140 * dt,
        y: next.helper.y + (dy / len) * 140 * dt,
      };
      if (next.kind === "home" ? canWalkHome(p, houseTier) : isWalkable(p)) next.helper = p;
      else next.helper = null;
    }
  }
  if (next.score >= next.items.length) {
    next.done = true;
    next.won = next.playerScore > 0;
  } else if (next.time <= 0) next.done = true;
  return next;
}
export function actActivity(a: Activity, player: Point): Activity {
  if (a.done) return a;
  const item = a.items.find(
    (i) =>
      !i.found &&
      (a.kind === "home" ? Math.hypot(i.x - player.x, i.y - player.y) : worldDistance(i, player)) <
        150,
  );
  if (!item) return a;
  const items = a.items.map((i) => (i.id === item.id ? { ...i, found: true } : i));
  const score = a.score + 1;
  return {
    ...a,
    items,
    score,
    playerScore: a.playerScore + 1,
    done: score === items.length,
    won: score === items.length,
  };
}
