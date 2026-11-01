export const INGREDIENTS = [
  { id: "bread", name: "빵", icon: "🍞" },
  { id: "patty", name: "패티", icon: "🥩" },
  { id: "dough", name: "도우", icon: "🫓" },
  { id: "cheese", name: "치즈", icon: "🧀" },
  { id: "cone", name: "콘", icon: "🍦" },
  { id: "milk", name: "우유", icon: "🥛" },
];
export const RECIPES = [
  { name: "햄버거", icon: "🍔", ingredients: ["bread", "patty"] },
  { name: "피자", icon: "🍕", ingredients: ["dough", "cheese"] },
  { name: "아이스크림", icon: "🍦", ingredients: ["cone", "milk"] },
];
export type TruckPlay = { served: number; ready: number[]; ingredients: string[] };
export function newTruck(): TruckPlay {
  return { served: 0, ready: [], ingredients: [] };
}
export function chooseIngredient(t: TruckPlay, id: string): TruckPlay {
  const r = RECIPES[t.served + t.ready.length];
  if (!r || !r.ingredients.includes(id) || t.ingredients.includes(id)) return t;
  return { ...t, ingredients: [...t.ingredients, id] };
}
export function cookTruck(t: TruckPlay, capacity: number): TruckPlay {
  const index = t.served + t.ready.length,
    r = RECIPES[index];
  if (!r || t.ready.length >= capacity || t.ingredients.length !== 2) return t;
  return { ...t, ready: [...t.ready, index], ingredients: [] };
}
export function serveTruck(t: TruckPlay, near: boolean): TruckPlay {
  if (!near || t.ready[0] !== t.served) return t;
  return { ...t, served: t.served + 1, ready: t.ready.slice(1) };
}
