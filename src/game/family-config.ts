import { NICKNAMES, normalizeRoomCode, type Nickname } from "./family-room.ts";
export type FamilyConfiguration =
  { mode: "local" } | { mode: "invalid" } | { mode: "supabase"; url: string; key: string };
export function familyConfiguration(url: string, key: string): FamilyConfiguration {
  if (!url && !key) return { mode: "local" };
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !key ||
      (!local && parsed.protocol !== "https:") ||
      (local && !["http:", "https:"].includes(parsed.protocol))
    )
      return { mode: "invalid" };
    let publicKey = key.startsWith("sb_publishable_") && key.length > 15;
    if (key.startsWith("eyJ")) {
      const part = key.split(".")[1];
      const role = part
        ? JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/"))).role
        : null;
      publicKey = role === "anon";
    }
    if (!publicKey) return { mode: "invalid" };
    return { mode: "supabase", url: parsed.origin + parsed.pathname.replace(/\/$/, ""), key };
  } catch {
    return { mode: "invalid" };
  }
}
export type FamilyMembership = { familyId: string; nickname: Nickname };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseMembership(input: unknown): FamilyMembership | null {
  if (!input || typeof input !== "object") return null;
  const m = input as Record<string, unknown>;
  return typeof m["family_id"] === "string" &&
    uuid.test(m["family_id"]) &&
    NICKNAMES.includes(m["nickname"] as Nickname)
    ? { familyId: m["family_id"].toLowerCase(), nickname: m["nickname"] as Nickname }
    : null;
}
export function familyTopic(familyId: string, code: string) {
  const clean = normalizeRoomCode(code);
  if (!uuid.test(familyId) || !clean) throw new Error("Invalid family room");
  return `family:${familyId.toLowerCase()}:${clean}`;
}

// Internal channel suffix; family UUID + RLS isolates each family. Players never enter it.
export const FAMILY_SPACE_CODE = "FAM222";
export const familySpaceTopic = (familyId: string) => familyTopic(familyId, FAMILY_SPACE_CODE);
