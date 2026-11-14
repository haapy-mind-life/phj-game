import { countdown, nextRandom, type Outcome } from "../arcade.ts";

// mn-16 친구 구하기: a 4×4 board of road tiles. Tap a tile to turn it a quarter. Make one road from
// Hyunjun (left of the top-left tile) to the friend (right of the bottom-right tile). Four boards,
// 150 s. Every board is built from a real road, so it can always be solved.
export const RESCUE_GOAL = 4;
export const RESCUE_SECONDS = 150;
export const SIZE = 4;
/** Road ends as bits: north 1, east 2, south 4, west 8. */
export const N = 1,
  E = 2,
  S = 4,
  W = 8;
export type RescueGame = {
  outcome: Outcome;
  score: number;
  remaining: number;
  tiles: number[];
  turns: number;
  seed: number;
};
export const rotate = (m: number) => ((m << 1) | (m >> 3)) & 15;
const opposite = (d: number) => rotate(rotate(d));
function board(seed: number): { tiles: number[]; seed: number } {
  let r: number;
  let s = seed;
  for (;;) {
    // A road that only goes right or down, from the top-left to the bottom-right.
    const tiles = Array.from({ length: SIZE * SIZE }, () => 0);
    let x = 0,
      y = 0,
      from = W;
    while (true) {
      let to: number;
      if (x === SIZE - 1 && y === SIZE - 1) to = E;
      else if (x === SIZE - 1) to = S;
      else if (y === SIZE - 1) to = E;
      else {
        [r, s] = nextRandom(s);
        to = r < 0.5 ? E : S;
      }
      tiles[y * SIZE + x] = from | to;
      if (to === E && x === SIZE - 1) break;
      if (to === E) x++;
      else y++;
      from = opposite(to);
    }
    // Other squares get random straight or corner pieces.
    for (let i = 0; i < tiles.length; i++)
      if (!tiles[i]) {
        [r, s] = nextRandom(s);
        tiles[i] = r < 0.5 ? N | S : N | E;
      }
    // Turn every tile a random number of times.
    for (let i = 0; i < tiles.length; i++) {
      [r, s] = nextRandom(s);
      for (let k = Math.floor(r * 4); k > 0; k--) tiles[i] = rotate(tiles[i]!);
    }
    if (!connected(tiles)) return { tiles, seed: s };
  }
}
/** True when a road runs from the left of the top-left tile to the right of the bottom-right one. */
export function connected(tiles: readonly number[]): boolean {
  let x = 0,
    y = 0,
    from = W;
  const seen = new Set<number>();
  for (;;) {
    const i = y * SIZE + x;
    const t = tiles[i]!;
    if (!(t & from) || seen.has(i)) return false;
    seen.add(i);
    const out = t & ~from;
    if (x === SIZE - 1 && y === SIZE - 1 && out === E) return true;
    if (out === E) x++;
    else if (out === W) x--;
    else if (out === S) y++;
    else if (out === N) y--;
    else return false;
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return false;
    from = opposite(out);
  }
}
export function createRescue(seed = 1): RescueGame {
  const b = board(seed);
  return { outcome: "playing", score: 0, remaining: RESCUE_SECONDS, turns: 0, ...b };
}
export function turnTile(g: RescueGame, i: number): RescueGame {
  if (g.outcome !== "playing" || !Number.isInteger(i) || i < 0 || i >= SIZE * SIZE) return g;
  const tiles = g.tiles.slice();
  tiles[i] = rotate(tiles[i]!);
  if (!connected(tiles)) return { ...g, tiles, turns: g.turns + 1 };
  const score = g.score + 1;
  if (score >= RESCUE_GOAL) return { ...g, tiles, score, outcome: "won" };
  return { ...g, score, turns: g.turns + 1, ...board(g.seed) };
}
export function tickRescue(g: RescueGame, dt: number): RescueGame {
  return countdown(g, dt);
}

/** One way to solve a board: for each road square, the turned tile it needs. Null if none. */
export function solve(tiles: readonly number[]): Map<number, number> | null {
  const need = new Map<number, number>();
  const walk = (x: number, y: number, from: number): boolean => {
    const i = y * SIZE + x;
    if (need.has(i)) return false;
    let m = tiles[i]!;
    for (let k = 0; k < 4; k++, m = rotate(m)) {
      if (!(m & from)) continue;
      const out = m & ~from;
      need.set(i, m);
      if (x === SIZE - 1 && y === SIZE - 1 && out === E) return true;
      const nx = x + (out === E ? 1 : out === W ? -1 : 0);
      const ny = y + (out === S ? 1 : out === N ? -1 : 0);
      if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && walk(nx, ny, opposite(out))) return true;
      need.delete(i);
    }
    return false;
  };
  return walk(0, 0, W) ? need : null;
}
