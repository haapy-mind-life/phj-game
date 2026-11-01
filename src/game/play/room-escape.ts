export type Cell = { x: number; y: number };
export type RoomDirection = "up" | "left" | "down" | "right";
export type RoomRun = {
  room: 0 | 1 | 2;
  phase: "ready" | "playing" | "paused" | "room-clear" | "won" | "lost";
  player: Cell;
  crate: Cell;
  key: boolean;
  elapsed: number;
};
export const ROOM_RUN_REWARD = 40;
export const ROOM_MAPS = [
  ["#######", "#..#..#", "#.....#", "#..#..#", "#######"],
  ["#######", "#.....#", "#.....#", "#..#..#", "#######"],
  ["#######", "#..#..#", "#.....#", "#..#..#", "#######"],
] as const;
export const ROOM_EXITS: readonly Cell[] = [
  { x: 5, y: 3 },
  { x: 5, y: 1 },
  { x: 5, y: 1 },
];
export const KEY_CELL = { x: 5, y: 1 };
export const PLATE_CELL = { x: 5, y: 2 };
export const BRIDGE_CELL = { x: 3, y: 2 };
export const ROOM_DIRECTIONS: Record<RoomDirection, Cell> = {
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
};
export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const bridgeOpen = (g: RoomRun) => g.elapsed % 7 >= 3;
export const roomDoorOpen = (g: RoomRun) =>
  g.room === 0 ? g.key : g.room === 1 ? sameCell(g.crate, PLATE_CELL) : true;
export const newRoomRun = (): RoomRun => ({
  room: 0,
  phase: "ready",
  player: { x: 1, y: 3 },
  crate: { x: 3, y: 2 },
  key: false,
  elapsed: 0,
});
export function retryRoom(g: RoomRun): RoomRun {
  return { ...newRoomRun(), room: g.room, phase: "playing" };
}
export function nextRoom(g: RoomRun): RoomRun {
  return g.phase === "room-clear" && g.room < 2
    ? retryRoom({ ...g, room: (g.room + 1) as 1 | 2 })
    : g;
}
export function moveRoom(g: RoomRun, direction: RoomDirection): RoomRun {
  if (g.phase !== "playing") return g;
  const d = ROOM_DIRECTIONS[direction];
  const target = { x: g.player.x + d.x, y: g.player.y + d.y };
  const walkable = (p: Cell) => ROOM_MAPS[g.room][p.y]?.[p.x] === ".";
  if (!walkable(target)) return g;
  let crate = g.crate;
  if (g.room === 1 && sameCell(target, crate)) {
    const pushed = { x: crate.x + d.x, y: crate.y + d.y };
    if (!walkable(pushed)) return g;
    crate = pushed;
  }
  const next = {
    ...g,
    player: target,
    crate,
    key: g.key || (g.room === 0 && sameCell(target, KEY_CELL)),
  };
  if (g.room === 2 && sameCell(target, BRIDGE_CELL) && !bridgeOpen(g))
    return { ...next, phase: "lost" };
  if (sameCell(target, ROOM_EXITS[g.room]!)) {
    if (!roomDoorOpen(next)) return g;
    return { ...next, phase: g.room === 2 ? "won" : "room-clear" };
  }
  return next;
}
export function tickRoom(g: RoomRun, seconds: number): RoomRun {
  if (g.phase !== "playing" || g.room !== 2 || !Number.isFinite(seconds) || seconds <= 0) return g;
  const next = { ...g, elapsed: g.elapsed + seconds };
  // Crossing any red interval is unsafe, even if a slow frame ends on green again.
  if (sameCell(g.player, BRIDGE_CELL) && (!bridgeOpen(g) || seconds >= 7 - (g.elapsed % 7)))
    return { ...next, phase: "lost" };
  return next;
}
