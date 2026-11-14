/**
 * Robots shown in the watch as "coming soon" pictures only (B6 · R-01~R-08 defaults, 2026-11-14).
 * They are not robot species: no card, no save field, no summon, fusion, army or legend slot.
 * Their ids are deliberately outside `RobotSpeciesId`, so `isRobotId` and save normalizing drop them.
 */
export type PreviewRobotId = "pv-bluecabi" | "pv-golden-kaldkeite";

export type PreviewRobot = {
  id: PreviewRobotId;
  /** Working name the child gave (R-01: not final). */
  workName: string;
  /** Descriptive name shown under the picture. */
  name: string;
  /** One line about the robot. */
  about: string;
  /** What it will turn into later; text only until the transformations are approved (R-07). */
  forms: readonly string[];
};

export const PREVIEW_ROBOTS: readonly PreviewRobot[] = [
  {
    id: "pv-bluecabi",
    workName: "블루카비",
    name: "푸른 번개 경찰 로봇",
    about: "경찰 모자와 작은 사이렌 두 개, 번개 무늬를 단 파란 경찰 로봇이야.",
    forms: ["로봇", "경찰차"],
  },
  {
    id: "pv-golden-kaldkeite",
    workName: "황금 칼드케이트",
    name: "초황금 다중 변신 로봇",
    about: "뾰족한 금빛 헬멧과 파란 전기 심장을 가진 황금 로봇이야.",
    forms: ["로봇", "경찰차", "레이싱카", "구급차", "소방차", "비행기", "전투기", "배", "잠수함"],
  },
];

export const isPreviewRobotId = (v: unknown): v is PreviewRobotId =>
  PREVIEW_ROBOTS.some((r) => r.id === v);
