export type StageId = 1 | 2 | 3 | 4 | 5 | "clear";
export type TapAction = "grab" | "descend" | "climb" | "fly" | "jump";
export type TapContext = {
  craneActive: boolean;
  ladderTop: boolean;
  ladderReady: boolean;
  flying: boolean;
};
const STAGES = [
  { id: 1, name: "달리기", minScore: 0 },
  { id: 2, name: "몬스터", minScore: 200 },
  { id: 3, name: "비밀 사다리", minScore: 400 },
  { id: 4, name: "하늘 모험", minScore: 600 },
  { id: 5, name: "챔피언 코스", minScore: 800 },
  { id: "clear", name: "완주", minScore: 1000 },
] as const;
export function stageForScore(score: number) {
  const n = Math.max(0, score);
  if (n >= 1000) return STAGES[5];
  if (n >= 800) return STAGES[4];
  if (n >= 600) return STAGES[3];
  if (n >= 400) return STAGES[2];
  if (n >= 200) return STAGES[1];
  return STAGES[0];
}
export function resolveTapAction(c: TapContext): TapAction {
  if (c.craneActive) return "grab";
  if (c.ladderTop) return "descend";
  if (c.ladderReady) return "climb";
  if (c.flying) return "fly";
  return "jump";
}
