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
export type Car = {
  id: string;
  name: string;
  kind: (typeof CAR_KINDS)[number]["shape"];
  color: string;
  number: number;
  variation: number;
  cost: number;
  ability: string;
  upgrade: string;
};
export const CARS: Car[] = [
  {
    id: "car-001",
    name: "현준이 기본 차",
    kind: "sport",
    color: "#70cba7",
    number: 1,
    variation: 0,
    cost: 0,
    ability: "꾸러미 배달",
    upgrade: "넓은 적재함 · 배달 보상 +20%",
  },
  {
    id: "car-021",
    name: "반짝 경찰차",
    kind: "police",
    color: "#63b6ef",
    number: 2,
    variation: 0,
    cost: 120,
    ability: "사이렌 · 도난 물건 찾기",
    upgrade: "탐색기 · 단서 방향 표시",
  },
  {
    id: "car-011",
    name: "용감 소방차",
    kind: "fire",
    color: "#f46f7b",
    number: 3,
    variation: 0,
    cost: 200,
    ability: "물대포로 불꽃 끄기",
    upgrade: "넓은 물줄기 · 분사 폭 +50%",
  },
  {
    id: "car-031",
    name: "친절 구급차",
    kind: "ambulance",
    color: "#faf4de",
    number: 4,
    variation: 0,
    cost: 280,
    ability: "안전하게 데려다주기",
    upgrade: "구조 좌석 · 두 명 함께 탑승",
  },
  {
    id: "car-101",
    name: "냠냠 푸드트럭",
    kind: "foodtruck",
    color: "#f2c94c",
    number: 5,
    variation: 0,
    cost: 360,
    ability: "내 트럭에서 장사",
    upgrade: "조리대 확장 · 음식 두 개 준비",
  },
];
export function carById(id: string): Car {
  return CARS.find((car) => car.id === id) ?? CARS[0]!;
}
export const CAR_COUNT = CARS.length;
export const ENGINE_COST = 60;
export const SPECIAL_COST = 100;
export type CarUpgrade = { engine: boolean; special: boolean };
export function canBuyCar(owned: string[], id: string) {
  const index = CARS.findIndex((c) => c.id === id);
  return index > 0 && !owned.includes(id) && owned.includes(CARS[index - 1]!.id);
}
