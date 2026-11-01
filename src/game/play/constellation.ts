export const DOTS = [
  { x: 100, y: 230 },
  { x: 200, y: 110 },
  { x: 330, y: 185 },
  { x: 450, y: 90 },
  { x: 560, y: 210 },
  { x: 660, y: 125 },
];
export function traceNext(score: number, point: { x: number; y: number }) {
  const next = DOTS[score];
  return next && Math.hypot(next.x - point.x, next.y - point.y) <= 38 ? score + 1 : score;
}
