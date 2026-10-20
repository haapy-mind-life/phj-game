export type FamilyAppearanceId = "hyunjun" | "dad" | "mom" | "sister";
const profiles = {
  현준: { id: "hyunjun", name: "현준", color: "#71bfa7" },
  아빠: { id: "dad", name: "아빠", color: "#79aee0" },
  엄마: { id: "mom", name: "엄마", color: "#efac98" },
  누나: { id: "sister", name: "누나", color: "#b1a2d9" },
} as const;
export function familyIdentity(nickname?: string | null) {
  return profiles[nickname as keyof typeof profiles] ?? profiles.현준;
}
