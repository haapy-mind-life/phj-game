import { CARS, canBuyCar, ENGINE_COST, SPECIAL_COST, type CarUpgrade } from "../game/cars.ts";
import { HOME_LOTS, type HomeLotId } from "../game/kid-world.ts";
import {
  ACTOR_IDS,
  OUTFITS,
  PREMIUM_CARS,
  REWARDS,
  PARTY_LIMIT,
  isHalloween,
  FOOD_PRICES,
} from "../game/world-content.ts";
export type CropId = "radish" | "beet" | "lettuce" | "carrot" | "sunflower";
export type Outfit = "mint" | "peach" | "lavender" | (typeof OUTFITS)[number]["id"];
export type Wallpaper = "cream" | "sky" | "rose";
export type FriendId = "toto" | "lulu";
export type AnimalId = "bori";
export type AnimalState = { fullness: number; friendship: number };
export type Crop = {
  id: CropId;
  name: string;
  goldName: string;
  seedCost: number;
  sellPrice: number;
  goldSellPrice: number;
  waterNeeded: number;
};
export const CROPS: Crop[] = [
  {
    id: "radish",
    name: "동글 무",
    goldName: "반짝 무",
    seedCost: 0,
    sellPrice: 8,
    goldSellPrice: 16,
    waterNeeded: 2,
  },
  {
    id: "beet",
    name: "하트 사탕무",
    goldName: "반짝 사탕무",
    seedCost: 4,
    sellPrice: 14,
    goldSellPrice: 28,
    waterNeeded: 2,
  },
  {
    id: "lettuce",
    name: "폭신 양상추",
    goldName: "반짝 양상추",
    seedCost: 6,
    sellPrice: 18,
    goldSellPrice: 36,
    waterNeeded: 3,
  },
  {
    id: "carrot",
    name: "토끼 당근",
    goldName: "반짝 당근",
    seedCost: 8,
    sellPrice: 24,
    goldSellPrice: 48,
    waterNeeded: 3,
  },
  {
    id: "sunflower",
    name: "방긋 해바라기",
    goldName: "반짝 해바라기",
    seedCost: 10,
    sellPrice: 30,
    goldSellPrice: 60,
    waterNeeded: 4,
  },
];
export const FURNITURE = [
  { id: "bed", name: "구름 침대", cost: 0 },
  { id: "rug", name: "꽃잎 러그", cost: 0 },
  { id: "plant", name: "새싹 화분", cost: 0 },
  { id: "sofa", name: "복숭아 소파", cost: 25 },
  { id: "lamp", name: "별빛 스탠드", cost: 20 },
  { id: "shelf", name: "그림책 책장", cost: 30 },
  { id: "teddy", name: "곰돌이 친구", cost: 15 },
  { id: "window", name: "무지개 창문", cost: 35 },
] as const;
export type FurnitureId = (typeof FURNITURE)[number]["id"];
export const DECOR = [
  { id: "pumpkin", name: "호박 등불", emoji: "🎃", cost: 10, halloween: true },
  { id: "ghost", name: "귀여운 유령", emoji: "👻", cost: 15, halloween: true },
  { id: "bat", name: "박쥐 장식", emoji: "🦇", cost: 10, halloween: true },
  { id: "candle", name: "도깨비 촛불", emoji: "🕯️", cost: 8, halloween: true },
  { id: "web", name: "반짝 거미줄", emoji: "🕸️", cost: 8, halloween: true },
  { id: "cauldron", name: "마법 솥", emoji: "🍲", cost: 20, halloween: true },
  { id: "balloon", name: "파티 풍선", emoji: "🎈", cost: 6, halloween: false },
  { id: "flower", name: "꽃병", emoji: "🌷", cost: 8, halloween: false },
  { id: "sofa", name: "푹신 소파", emoji: "🛋️", cost: 25, halloween: false },
  { id: "tree", name: "작은 나무", emoji: "🪴", cost: 12, halloween: false },
] as const;
export type DecorId = (typeof DECOR)[number]["id"];
export type PlacedDecor = { id: DecorId; x: number; y: number };
export const DECOR_LIMIT = 24;
export const DECOR_AREA = { minX: 140, maxX: 2060, minY: 220, maxY: 1320 } as const;
export const YARD = [
  { id: "porch-pumpkin", name: "현관 호박", emoji: "🎃", cost: 10 },
  { id: "lights", name: "반짝 전구", emoji: "✨", cost: 12 },
  { id: "banner", name: "할로윈 깃발", emoji: "🎃🦇", cost: 12 },
  { id: "ghost-gate", name: "대문 유령", emoji: "👻", cost: 10 },
] as const;
export type YardId = (typeof YARD)[number]["id"];
export const CANDY_SPOTS = [
  { id: "candy-kitchen", x: 330, y: 540 },
  { id: "candy-play", x: 1960, y: 590 },
  { id: "candy-dining", x: 1820, y: 1230 },
  { id: "candy-bed", x: 260, y: 1210 },
  { id: "candy-hall", x: 1110, y: 760 },
] as const;
// Keep every party collectible reachable before rooms are expanded.
export function candySpotsForHouse(tier: number) {
  return CANDY_SPOTS.map((spot) => {
    if (spot.id === "candy-play" && tier < 2) return { ...spot, x: 1110, y: 450 };
    if (spot.id === "candy-bed" && tier < 3) return { ...spot, x: 1110, y: 1120 };
    return spot;
  });
}
export const CANDY_REWARD = 5;
export const PARTY_BONUS = 50;
export const PARTY_DECOR_NEEDED = 3;
export type Halloween = { active: boolean; candy: string[]; completed: boolean };
export const halloweenDecorCount = (decor: PlacedDecor[]) =>
  decor.filter((d) => DECOR.find((x) => x.id === d.id)?.halloween).length;
export type Plot = { crop: CropId | null; water: number; gold: boolean };
export type GameState = {
  companions: string[];
  guests: string[];
  ownedOutfits: Outfit[];
  ownedCars: string[];
  settledActivities: string[];
  version: 3;
  carUpgrades: Record<string, CarUpgrade>;
  money: number;
  plots: Plot[];
  hasTicket: boolean;
  bestRun: number;
  runnerBest: number;
  runs: number;
  harvests: number;
  outfit: Outfit;
  wallpaper: Wallpaper;
  ownedFurniture: FurnitureId[];
  room: (FurnitureId | null)[];
  friendship: Record<FriendId, number>;
  animals: Record<AnimalId, AnimalState>;
  settledRuns: string[];
  miniBest: Record<"treasure" | "stars" | "fishing" | "constellation", number>;
  settledMinis: string[];
  settledFoodSales: string[];
  visitedSeaTreasures: string[];
  houseTier: number;
  /** Which `HOME_LOTS` entry the family home stands on; "original" is the legacy x≈480 house. */
  homeLot: HomeLotId;
  decor: PlacedDecor[];
  yard: YardId[];
  halloween: Halloween;
};
export const PLOT_COUNT = 6;
export const TICKET_PRICE = 50000;
export const cropById = (id: CropId) => CROPS.find((c) => c.id === id)!;
export const coins = (n: number) => `${Math.floor(n).toLocaleString("ko-KR")} 별코인`;
export const won = coins;
const knownCrop = (v: unknown): v is CropId => CROPS.some((c) => c.id === v);
const knownFurniture = (v: unknown): v is FurnitureId => FURNITURE.some((f) => f.id === v);
const finite = (v: unknown, fallback = 0, max = 1e12) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(0, Math.floor(v)))
    : fallback;
const object = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const clampDecor = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : lo;
const emptyPlot = (): Plot => ({ crop: null, water: 0, gold: false });
export function migrateSave(input: unknown): GameState {
  const raw = object(input),
    oldPlots = Array.isArray(raw["plots"]) ? raw["plots"] : [];
  const starter: FurnitureId[] = ["bed", "rug", "plant"];
  const owned = [
    ...new Set([
      ...starter,
      ...(Array.isArray(raw["ownedFurniture"]) ? raw["ownedFurniture"].filter(knownFurniture) : []),
    ]),
  ];
  const placed = new Set<FurnitureId>();
  const sourceRoom = Array.isArray(raw["room"])
    ? raw["room"]
    : ["bed", null, "plant", null, "rug", null];
  const room = Array.from({ length: 6 }, (_, i) => {
    const item = sourceRoom[i];
    if (!knownFurniture(item) || !owned.includes(item) || placed.has(item)) return null;
    placed.add(item);
    return item;
  });
  const actorList = (value: unknown) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter((id): id is string => typeof id === "string" && ACTOR_IDS.includes(id)),
          ),
        ].slice(0, PARTY_LIMIT)
      : [];
  const companions = actorList(raw["companions"]);
  const ownedOutfits: Outfit[] = [
    "mint",
    "peach",
    "lavender",
    ...OUTFITS.filter(
      (o) => Array.isArray(raw["ownedOutfits"]) && raw["ownedOutfits"].includes(o.id),
    ).map((o) => o.id),
  ];
  return {
    companions,
    guests: actorList(raw["guests"]).filter((id) => !companions.includes(id)),
    ownedOutfits,
    ownedCars: [
      "car-001",
      ...CARS.slice(1)
        .filter(
          (c) =>
            raw["version"] === 3 &&
            Array.isArray(raw["ownedCars"]) &&
            raw["ownedCars"].includes(c.id),
        )
        .map((c) => c.id),
    ],
    carUpgrades: Object.fromEntries(
      CARS.map((c) => {
        const owned =
          c.id === "car-001" ||
          (raw["version"] === 3 &&
            Array.isArray(raw["ownedCars"]) &&
            raw["ownedCars"].includes(c.id));
        const upgrades = object(object(raw["carUpgrades"])[c.id]);
        return [
          c.id,
          {
            engine: owned && upgrades["engine"] === true,
            special: owned && upgrades["special"] === true,
          },
        ];
      }),
    ),
    settledActivities: Array.isArray(raw["settledActivities"])
      ? raw["settledActivities"]
          .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 160)
          .slice(-200)
      : [],
    miniBest: {
      constellation: finite(object(raw["miniBest"])["constellation"], 0, 6),
      treasure: finite(object(raw["miniBest"])["treasure"], 0, 6),
      stars: finite(object(raw["miniBest"])["stars"], 0, 18),
      fishing: finite(object(raw["miniBest"])["fishing"], 0, 5),
    },
    settledMinis: Array.isArray(raw["settledMinis"])
      ? raw["settledMinis"]
          .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 160)
          .slice(-50)
      : [],
    settledFoodSales: Array.isArray(raw["settledFoodSales"])
      ? raw["settledFoodSales"]
          .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 120)
          .slice(-80)
      : [],
    visitedSeaTreasures: Array.isArray(raw["visitedSeaTreasures"])
      ? raw["visitedSeaTreasures"]
          .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 120)
          .slice(-30)
      : [],
    decor: Array.isArray(raw["decor"])
      ? raw["decor"]
          .map((d) => object(d))
          .filter((d) => DECOR.some((x) => x.id === d["id"]) && typeof d["x"] === "number")
          .slice(0, DECOR_LIMIT)
          .map((d) => ({
            id: d["id"] as DecorId,
            x: clampDecor(d["x"], DECOR_AREA.minX, DECOR_AREA.maxX),
            y: clampDecor(d["y"], DECOR_AREA.minY, DECOR_AREA.maxY),
          }))
      : [],
    yard: Array.isArray(raw["yard"])
      ? YARD.map((y) => y.id).filter((id) => (raw["yard"] as unknown[]).includes(id))
      : [],
    halloween: {
      active: object(raw["halloween"])["active"] === true,
      candy: Array.isArray(object(raw["halloween"])["candy"])
        ? CANDY_SPOTS.map((c) => c.id as string).filter((id) =>
            (object(raw["halloween"])["candy"] as unknown[]).includes(id),
          )
        : [],
      completed: object(raw["halloween"])["completed"] === true,
    },
    houseTier: [1, 2, 3, 4, 5].includes(raw["houseTier"] as number)
      ? (raw["houseTier"] as number)
      : 1,
    homeLot: HOME_LOTS.some((l) => l.id === raw["homeLot"])
      ? (raw["homeLot"] as HomeLotId)
      : "original",
    version: 3,
    money: Math.min(
      1e12,
      finite(raw["money"], 50) +
        (raw["version"] === 3
          ? 0
          : PREMIUM_CARS.filter(
              (c) => Array.isArray(raw["ownedCars"]) && raw["ownedCars"].includes(c.id),
            ).reduce((sum, c) => sum + c.cost, 0)),
    ),
    plots: Array.from({ length: PLOT_COUNT }, (_, i) => {
      const p = object(oldPlots[i]);
      if (!knownCrop(p["crop"])) return emptyPlot();
      const crop = cropById(p["crop"]);
      return {
        crop: p["crop"],
        water: finite(p["water"], 0, crop.waterNeeded),
        gold: p["gold"] === true,
      };
    }),
    hasTicket: raw["hasTicket"] === true,
    bestRun: finite(raw["bestRun"]),
    runnerBest: finite(raw["runnerBest"], 0, 1000),
    runs: finite(raw["runs"]),
    harvests: finite(raw["harvests"]),
    outfit: ownedOutfits.includes(raw["outfit"] as Outfit) ? (raw["outfit"] as Outfit) : "mint",
    wallpaper:
      raw["wallpaper"] === "sky" || raw["wallpaper"] === "rose" ? raw["wallpaper"] : "cream",
    ownedFurniture: owned,
    room,
    friendship: {
      toto: finite(object(raw["friendship"])["toto"], 0, 3),
      lulu: finite(object(raw["friendship"])["lulu"], 0, 3),
    },
    animals: {
      bori: {
        fullness: finite(object(object(raw["animals"])["bori"])["fullness"], 2, 3),
        friendship: finite(object(object(raw["animals"])["bori"])["friendship"], 0, 3),
      },
    },
    settledRuns: Array.isArray(raw["settledRuns"])
      ? raw["settledRuns"]
          .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 160)
          .slice(-50)
      : [],
  };
}
export type ActivityKind = "restaurant" | "home" | "sea" | "festival";
export type PlayKind =
  "delivery" | "police" | "fire" | "ambulance" | "sea" | "truck-sale" | "truck-complete";
export type WorldAction =
  | { type: "upgrade-car"; id: string; upgrade: "engine" | "special" }
  | { type: "settle-play"; id: string; activity: PlayKind; bonus: boolean }
  | { type: "companion"; id: string; mode: "follow" | "invite" | "leave" }
  | { type: "buy-outfit" | "buy-car"; id: string }
  | { type: "buy-meal"; priceIndex: number }
  | {
      type: "settle-activity";
      id: string;
      activity: ActivityKind;
      completed: boolean;
      now?: string;
    }
  | {
      type: "settle-mini";
      id: string;
      game: "treasure" | "stars" | "fishing" | "constellation";
      score: number;
    }
  | { type: "plant"; index: number; crop: CropId }
  | { type: "water" | "harvest"; index: number }
  | { type: "settle-run"; id: string; score: number; coins: number; clear: boolean }
  | { type: "buy-furniture"; id: FurnitureId }
  | { type: "place-furniture"; id: FurnitureId | null; slot: number }
  | { type: "outfit"; outfit: Outfit }
  | { type: "wallpaper"; wallpaper: Wallpaper }
  | { type: "friend-play"; id: FriendId }
  | { type: "feed-animal"; id: AnimalId }
  | { type: "sell-food"; id: string; foodId: string }
  | { type: "explore-sea"; id: string }
  | { type: "place-decor"; id: DecorId; x: number; y: number }
  | { type: "remove-decor"; index: number }
  | { type: "toggle-yard"; id: YardId }
  | { type: "start-party"; now?: string }
  | { type: "collect-candy"; id: string; now?: string }
  | { type: "upgrade-house" }
  | { type: "move-house"; lot: string };
export function reduceWorld(state: GameState, action: WorldAction): GameState {
  if (action.type === "companion") {
    if (!ACTOR_IDS.includes(action.id)) return state;
    const target = action.mode === "follow" ? state.companions : state.guests;
    if (action.mode !== "leave" && !target.includes(action.id) && target.length >= PARTY_LIMIT)
      return state;
    return {
      ...state,
      companions: [
        ...state.companions.filter((id) => id !== action.id),
        ...(action.mode === "follow" ? [action.id] : []),
      ],
      guests: [
        ...state.guests.filter((id) => id !== action.id),
        ...(action.mode === "invite" ? [action.id] : []),
      ],
    };
  }
  if (action.type === "buy-outfit") {
    const item = OUTFITS.find((o) => o.id === action.id);
    if (!item || state.ownedOutfits.includes(item.id) || state.money < item.cost) return state;
    return {
      ...state,
      money: state.money - item.cost,
      ownedOutfits: [...state.ownedOutfits, item.id],
      outfit: item.id,
    };
  }
  if (action.type === "buy-car") {
    const item = CARS.find((c) => c.id === action.id);
    if (!item || !canBuyCar(state.ownedCars, item.id) || state.money < item.cost) return state;
    return { ...state, money: state.money - item.cost, ownedCars: [...state.ownedCars, item.id] };
  }
  if (action.type === "upgrade-car") {
    if (
      !["engine", "special"].includes(action.upgrade) ||
      !state.ownedCars.includes(action.id) ||
      !CARS.some((c) => c.id === action.id)
    )
      return state;
    const current = state.carUpgrades[action.id] ?? { engine: false, special: false };
    const cost = action.upgrade === "engine" ? ENGINE_COST : SPECIAL_COST;
    if (current[action.upgrade] || state.money < cost) return state;
    return {
      ...state,
      money: state.money - cost,
      carUpgrades: { ...state.carUpgrades, [action.id]: { ...current, [action.upgrade]: true } },
    };
  }
  if (action.type === "settle-play") {
    if (
      !action.id ||
      action.id.length >= 160 ||
      state.settledActivities.includes(action.id) ||
      !["delivery", "police", "fire", "ambulance", "sea", "truck-sale", "truck-complete"].includes(
        action.activity,
      )
    )
      return state;
    const car = CARS.find((c) => c.kind === action.activity);
    if (car && !state.ownedCars.includes(car.id)) return state;
    const base = action.activity.startsWith("truck-") ? 10 : 40;
    const extra = action.bonus && action.activity !== "truck-sale" ? 10 : 0;
    const delivery =
      action.activity === "delivery" && state.carUpgrades["car-001"]?.special ? 8 : 0;
    return {
      ...state,
      money: Math.min(1e12, state.money + base + extra + delivery),
      settledActivities: [...state.settledActivities, action.id].slice(-200),
    };
  }
  if (action.type === "buy-meal") {
    const price = FOOD_PRICES[action.priceIndex];
    return price !== undefined && Number.isInteger(action.priceIndex) && state.money >= price
      ? { ...state, money: state.money - price }
      : state;
  }
  if (action.type === "settle-activity") {
    if (
      !Object.hasOwn(REWARDS, action.activity) ||
      !["restaurant", "home", "sea", "festival"].includes(action.activity) ||
      !action.completed ||
      !action.id ||
      action.id.length >= 160 ||
      state.settledActivities.includes(action.id)
    )
      return state;
    if (
      action.activity === "festival" &&
      !isHalloween(action.now ? new Date(action.now) : new Date())
    )
      return state;
    return {
      ...state,
      money: Math.min(1e12, state.money + REWARDS[action.activity]),
      settledActivities: [...state.settledActivities, action.id].slice(-200),
    };
  }

  if (action.type === "upgrade-house") {
    const prices = [0, 100, 350, 850, 1500];
    if (state.houseTier >= 5) return state;
    const cost = prices[state.houseTier]!;
    if (state.money < cost) return state;
    return { ...state, houseTier: state.houseTier + 1, money: state.money - cost };
  }
  if (action.type === "move-house") {
    // Moving is free: the house keeps its level, furniture and yard decorations.
    if (!HOME_LOTS.some((l) => l.id === action.lot) || state.homeLot === action.lot) return state;
    return { ...state, homeLot: action.lot as HomeLotId };
  }
  if (action.type === "sell-food") {
    const menu: Record<string, number> = {
      cutlet: 18,
      kimchi: 12,
      pizza: 25,
      cola: 8,
      "giant-pizza": 55,
      "gold-pizza": 150,
      "dino-burger": 60,
      "giant-icecream": 45,
    };
    if (
      !action.id ||
      action.id.length >= 120 ||
      state.settledFoodSales.includes(action.id) ||
      !Object.hasOwn(menu, action.foodId)
    )
      return state;
    return {
      ...state,
      money: Math.min(1e12, state.money + menu[action.foodId]!),
      settledFoodSales: [...state.settledFoodSales, action.id].slice(-80),
    };
  }
  if (action.type === "explore-sea") {
    const rewards: Record<string, number> = {
      "pearl-coral": 20,
      "star-fish": 25,
      "gold-shell": 35,
    };
    if (!Object.hasOwn(rewards, action.id) || state.visitedSeaTreasures.includes(action.id))
      return state;
    return {
      ...state,
      money: Math.min(1e12, state.money + rewards[action.id]!),
      visitedSeaTreasures: [...state.visitedSeaTreasures, action.id].slice(-30),
    };
  }
  if (action.type === "settle-mini") {
    const limits = { treasure: 6, stars: 18, fishing: 5, constellation: 6 };
    if (
      !Object.hasOwn(limits, action.game) ||
      !action.id ||
      action.id.length >= 160 ||
      state.settledMinis.includes(action.id) ||
      !Number.isFinite(action.score) ||
      action.score < 0
    )
      return state;
    const score = finite(action.score, 0, limits[action.game]);
    const multiplier = action.game === "stars" ? 2 : 4;
    return {
      ...state,
      money: Math.min(
        1e12,
        state.money +
          score * multiplier +
          (score === limits[action.game] ? REWARDS.miniCompletion : 0),
      ),
      miniBest: { ...state.miniBest, [action.game]: Math.max(state.miniBest[action.game], score) },
      settledMinis: [...state.settledMinis, action.id].slice(-50),
    };
  }
  if (action.type === "plant" || action.type === "water" || action.type === "harvest") {
    if (!Number.isInteger(action.index) || action.index < 0 || action.index >= PLOT_COUNT)
      return state;
    const plots = state.plots.slice(),
      plot = plots[action.index];
    if (!plot) return state;
    if (action.type === "plant") {
      if (plot.crop || !knownCrop(action.crop)) return state;
      const crop = cropById(action.crop);
      if (state.money < crop.seedCost) return state;
      plots[action.index] = { crop: crop.id, water: 0, gold: false };
      return { ...state, money: state.money - crop.seedCost, plots };
    }
    if (!plot.crop) return state;
    const crop = cropById(plot.crop);
    if (action.type === "water") {
      if (plot.water >= crop.waterNeeded) return state;
      plots[action.index] = { ...plot, water: plot.water + 1 };
      return { ...state, plots };
    }
    if (plot.water < crop.waterNeeded) return state;
    const harvests = state.harvests + 1,
      bonus = plot.gold || harvests % 5 === 0;
    plots[action.index] = emptyPlot();
    return {
      ...state,
      harvests,
      plots,
      money: Math.min(
        1e12,
        state.money +
          Math.ceil((bonus ? crop.goldSellPrice : crop.sellPrice) * REWARDS.harvestMultiplier),
      ),
    };
  }
  if (action.type === "settle-run") {
    if (
      !action.id ||
      action.id.length >= 160 ||
      state.settledRuns.includes(action.id) ||
      !Number.isFinite(action.score) ||
      !Number.isFinite(action.coins) ||
      action.score < 0 ||
      action.coins < 0
    )
      return state;
    const score = finite(action.score, 0, 1000),
      earned =
        finite(action.coins, 0, 200) +
        (action.clear && score === 1000 ? 25 + REWARDS.runnerClear : 0);
    return {
      ...state,
      money: Math.min(1e12, state.money + earned),
      bestRun: Math.max(state.bestRun, earned),
      runnerBest: Math.max(state.runnerBest, score),
      runs: state.runs + 1,
      settledRuns: [...state.settledRuns, action.id].slice(-50),
    };
  }
  if (action.type === "friend-play") {
    const current = state.friendship[action.id];
    if (current === undefined) return state;
    return {
      ...state,
      friendship: { ...state.friendship, [action.id]: Math.min(3, current + 1) },
    };
  }
  if (action.type === "feed-animal") {
    const current = state.animals[action.id];
    if (!current) return state;
    return {
      ...state,
      animals: {
        ...state.animals,
        [action.id]: {
          fullness: 3,
          friendship: Math.min(3, current.friendship + 1),
        },
      },
    };
  }
  if (action.type === "buy-furniture") {
    const item = FURNITURE.find((f) => f.id === action.id);
    if (!item || state.ownedFurniture.includes(item.id) || state.money < item.cost) return state;
    return {
      ...state,
      money: state.money - item.cost,
      ownedFurniture: [...state.ownedFurniture, item.id],
    };
  }
  if (action.type === "place-furniture") {
    if (
      !Number.isInteger(action.slot) ||
      action.slot < 0 ||
      action.slot >= 6 ||
      (action.id !== null && !state.ownedFurniture.includes(action.id))
    )
      return state;
    const room = state.room.map((id) => (action.id !== null && id === action.id ? null : id));
    room[action.slot] = action.id;
    return { ...state, room };
  }
  if (action.type === "place-decor") {
    const item = DECOR.find((d) => d.id === action.id);
    if (
      !item ||
      !Number.isFinite(action.x) ||
      !Number.isFinite(action.y) ||
      state.decor.length >= DECOR_LIMIT ||
      state.money < item.cost
    )
      return state;
    return {
      ...state,
      money: state.money - item.cost,
      decor: [
        ...state.decor,
        {
          id: item.id,
          x: clampDecor(action.x, DECOR_AREA.minX, DECOR_AREA.maxX),
          y: clampDecor(action.y, DECOR_AREA.minY, DECOR_AREA.maxY),
        },
      ],
    };
  }
  if (action.type === "remove-decor") {
    const placed = state.decor[action.index];
    if (!placed || !Number.isInteger(action.index)) return state;
    const refund = Math.floor(DECOR.find((d) => d.id === placed.id)!.cost / 2);
    return {
      ...state,
      money: state.money + refund,
      decor: state.decor.filter((_, i) => i !== action.index),
    };
  }
  if (action.type === "toggle-yard") {
    const item = YARD.find((y) => y.id === action.id);
    if (!item) return state;
    if (state.yard.includes(item.id))
      return { ...state, yard: state.yard.filter((id) => id !== item.id) };
    if (state.money < item.cost) return state;
    return { ...state, money: state.money - item.cost, yard: [...state.yard, item.id] };
  }
  if (action.type === "start-party") {
    if (!isHalloween(action.now ? new Date(action.now) : new Date())) return state;
    if (state.halloween.active || halloweenDecorCount(state.decor) < PARTY_DECOR_NEEDED)
      return state;
    return { ...state, halloween: { ...state.halloween, active: true, candy: [] } };
  }
  if (action.type === "collect-candy") {
    if (!isHalloween(action.now ? new Date(action.now) : new Date())) return state;
    const h = state.halloween;
    if (!h.active || !CANDY_SPOTS.some((c) => c.id === action.id) || h.candy.includes(action.id))
      return state;
    const candy = [...h.candy, action.id];
    const done = candy.length >= CANDY_SPOTS.length;
    const bonus = done && !h.completed ? PARTY_BONUS : 0;
    return {
      ...state,
      money: state.money + CANDY_REWARD + bonus,
      halloween: { active: !done, candy: done ? [] : candy, completed: h.completed || done },
    };
  }
  if (action.type === "outfit")
    return state.ownedOutfits.includes(action.outfit) ? { ...state, outfit: action.outfit } : state;
  if (action.type === "wallpaper") return { ...state, wallpaper: action.wallpaper };
  return state;
}
