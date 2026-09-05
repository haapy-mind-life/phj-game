import type { PlayerCombatState, WeaponKind } from "./types.ts";

export type StageId = 1 | 2 | 3 | 4 | 5 | "clear";
export type TapAction = "grab" | "descend" | "climb" | "fly" | "jump";
export type CraneReward = "banana" | "armor" | "coins" | "treasure";

export type StageDescriptor = {
  id: StageId;
  name: string;
  minScore: number;
};

export type TapContext = {
  craneActive: boolean;
  ladderTop: boolean;
  ladderReady: boolean;
  flying: boolean;
};

const STAGES: StageDescriptor[] = [
  { id: 1, name: "달리기", minScore: 0 },
  { id: 2, name: "몬스터", minScore: 200 },
  { id: 3, name: "비밀 사다리", minScore: 400 },
  { id: 4, name: "하늘 모험", minScore: 600 },
  { id: 5, name: "챔피언 코스", minScore: 800 },
  { id: "clear", name: "완주", minScore: 1000 },
];

export function stageForScore(score: number): StageDescriptor {
  const safeScore = Math.max(0, score);
  if (safeScore >= 1000) return STAGES[5];
  if (safeScore >= 800) return STAGES[4];
  if (safeScore >= 600) return STAGES[3];
  if (safeScore >= 400) return STAGES[2];
  if (safeScore >= 200) return STAGES[1];
  return STAGES[0];
}

export function resolveTapAction(context: TapContext): TapAction {
  if (context.craneActive) return "grab";
  if (context.ladderTop) return "descend";
  if (context.ladderReady) return "climb";
  if (context.flying) return "fly";
  return "jump";
}

export function chooseAutoWeapon(state: PlayerCombatState): WeaponKind | null {
  if (state.bananas > 0) return "banana";
  if (state.arrows > 0) return "bow";
  if (state.bullets > 0) return "gun";
  return null;
}

export function applyCraneReward(
  state: PlayerCombatState,
  money: number,
  reward: CraneReward,
): { state: PlayerCombatState; money: number } {
  if (reward === "banana") {
    return { state: { ...state, bananas: state.bananas + 5 }, money };
  }
  if (reward === "armor") {
    return { state: { ...state, armor: state.armor + 1 }, money };
  }
  if (reward === "coins") {
    return { state, money: money + 5 };
  }
  return { state, money: money + 10 };
}
