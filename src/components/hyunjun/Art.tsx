import { useReducedMotion } from "./useReducedMotion";
import type { Outfit, FurnitureId, CropId } from "@/lib/world-model";
import { characterUrl } from "@/game/character-art";
export function Star() {
  return <span aria-hidden="true">⭐</span>;
}
export function Mascot({
  outfit = "mint",
  small = false,
  moving = false,
  diving = false,
}: {
  outfit?: Outfit;
  small?: boolean;
  moving?: boolean;
  diving?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <img
      className={small ? "hj-mascot small" : "hj-mascot"}
      src={characterUrl(
        outfit,
        moving ? (diving ? "swim" : "walk") : "idle",
        diving,
        reducedMotion,
      )}
      alt=""
      draggable={false}
    />
  );
}
export function Building({ kind }: { kind: "home" | "run" | "farm" }) {
  return (
    <div className={`hj-building ${kind}`} aria-hidden="true">
      <div className="roof" />
      <div className="body">{kind === "home" ? "🏠" : kind === "run" ? "🏁" : "🌱"}</div>
    </div>
  );
}
export function CropArt({ id, grown = false }: { id: CropId; grown?: boolean }) {
  const e: Record<CropId, string> = {
    radish: "🌱",
    beet: "💗",
    lettuce: "🥬",
    carrot: "🥕",
    sunflower: "🌻",
  };
  return (
    <span className={grown ? "hj-crop grown" : "hj-crop"} aria-hidden="true">
      {grown ? e[id] : "🌱"}
    </span>
  );
}
export function FurnitureArt({ id }: { id: FurnitureId }) {
  const e: Record<FurnitureId, string> = {
    bed: "🛏️",
    rug: "🌼",
    plant: "🪴",
    sofa: "🛋️",
    lamp: "💡",
    shelf: "📚",
    teddy: "🧸",
    window: "🌈",
  };
  return (
    <span className="hj-furniture-art" aria-hidden="true">
      {e[id]}
    </span>
  );
}
