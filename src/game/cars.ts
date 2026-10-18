import { PREMIUM_CARS } from "./world-content.ts";
export const CAR_KINDS = [
  { name: "스포츠카", shape: "sport", roof: "낮은 레이싱 지붕" },
  { name: "소방차", shape: "fire", roof: "사다리" },
  { name: "경찰차", shape: "police", roof: "경광등" },
  { name: "구급차", shape: "ambulance", roof: "응급 표시" },
  { name: "몬스터트럭", shape: "monster", roof: "커다란 바퀴" },
  { name: "버스", shape: "bus", roof: "넓은 창문" },
  { name: "굴착기", shape: "excavator", roof: "굴착 팔" },
  { name: "캠핑카", shape: "camper", roof: "캠핑 지붕" },
  { name: "택시", shape: "taxi", roof: "택시 표시" },
  { name: "우주자동차", shape: "space", roof: "로켓 장치" },
  { name: "푸드트럭", shape: "foodtruck", roof: "먹거리 가게" },
  { name: "리무진", shape: "limo", roof: "길고 넓은 객실" },
] as const;
const COLOR_NAMES = [
  "딸기",
  "하늘",
  "레몬",
  "민트",
  "보라",
  "주황",
  "벚꽃",
  "바다",
  "초록",
  "별빛",
] as const;
const COLORS = [
  "#f46f7b",
  "#63b6ef",
  "#f2c94c",
  "#70cba7",
  "#9e8de5",
  "#f4985a",
  "#e99fce",
  "#448dba",
  "#78ab61",
  "#c6a578",
] as const;
export const CARS = [
  ...CAR_KINDS.flatMap((kind, kindIndex) =>
    COLOR_NAMES.map((colorName, colorIndex) => ({
      id: `car-${String(kindIndex * 10 + colorIndex + 1).padStart(3, "0")}`,
      name: `${colorName} ${kind.name}`,
      kind: kind.shape,
      color: COLORS[colorIndex],
      number: kindIndex * 10 + colorIndex + 1,
      variation: colorIndex,
    })),
  ),
  ...PREMIUM_CARS,
];
export type Car = (typeof CARS)[number];
export function carById(id: string): Car {
  return CARS.find((car) => car.id === id) ?? CARS[0]!;
}
export const CAR_COUNT = CARS.length;
