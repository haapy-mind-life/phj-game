import type { Point } from "./adventure.ts";
import { LANDMARKS } from "./kid-world.ts";
import { NEW_VILLAGES, RESTAURANTS } from "./world-content.ts";
import { worldDistance } from "./world-space.ts";

const contents = {
  mart: ["🍎 🥛 🥕", "장보기", "장보기 끝! 과일이랑 우유를 샀어."],
  "dad-office": ["💻 📋 💼", "아빠 응원하기", "아빠가 열심히 일하고 있어. 아빠 힘내요!"],
  school: ["✏️ 🎒 🖍️", "친구들과 공부하기", "친구들과 그림도 그리고 공부도 했어!"],
  toy: ["🤖 🚗 🧸", "장난감 놀이", "로봇이랑 자동차 장난감으로 놀았어!"],
  hospital: ["🧸 🩺 🌼", "의사 선생님 만나기", "의사 선생님이 반갑게 인사해 줬어. 튼튼하게 놀자!"],
  library: ["📖 🦕 🐳", "책 읽기", "공룡 책이랑 바다 책을 읽었어!"],
} as const;
export const TOWN_BUILDINGS = [
  ...LANDMARKS.map((l) => ({
    ...l,
    door: { x: l.x, y: l.y + 40 },
    items: contents[l.id][0],
    action: contents[l.id][1],
    response: contents[l.id][2],
  })),
  ...NEW_VILLAGES.flatMap((v) =>
    [-330, 330].flatMap((dx) => {
      const x = v.x + dx,
        y = v.y - 260;
      if (RESTAURANTS.some((r) => Math.hypot(r.x - x, r.y - y) < 250)) return [];
      return [
        {
          id: `${v.id}-${dx < 0 ? "west" : "east"}`,
          name: `${v.name} ${dx < 0 ? "왼쪽" : "오른쪽"} 이웃집`,
          x,
          y,
          color: v.color,
          emoji: "🏡",
          door: { x, y: y + 110 },
          items: "🛋️ 🧸 🌷",
          action: "이웃과 인사하기",
          response: `${v.friend}와 인사하고 집에서 함께 놀았어!`,
        },
      ];
    }),
  ),
];
export type TownBuilding = (typeof TOWN_BUILDINGS)[number];
export function nearTownBuilding(p: Point) {
  return (
    TOWN_BUILDINGS.filter((b) => worldDistance(p, b.door) < 170).sort(
      (a, b) => worldDistance(p, a.door) - worldDistance(p, b.door),
    )[0] ?? null
  );
}
export const BUILDING_ROOM = {
  width: 1500,
  height: 1100,
  entry: { x: 750, y: 820 },
  exit: { x: 750, y: 970 },
  activity: { x: 750, y: 440 },
};
export function canWalkBuilding(p: Point) {
  return (
    p.x >= 120 &&
    p.x <= 1380 &&
    p.y >= 320 &&
    p.y <= 980 &&
    !(p.x > 260 && p.x < 1240 && p.y > 330 && p.y < 450)
  );
}
export function stepBuilding(p: Point, d: Point, dt: number): Point {
  const t = Math.max(0, Math.min(0.05, dt)),
    len = Math.max(1, Math.hypot(d.x, d.y));
  const next = { ...p };
  const x = p.x + (d.x * 245 * t) / len,
    y = p.y + (d.y * 245 * t) / len;
  if (canWalkBuilding({ x, y: p.y })) next.x = x;
  if (canWalkBuilding({ x: next.x, y })) next.y = y;
  return next;
}
