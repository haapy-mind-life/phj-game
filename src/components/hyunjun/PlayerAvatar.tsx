import type { Outfit } from "@/lib/world-model";
import { characterUrl } from "@/game/character-art";
import { useReducedMotion } from "./useReducedMotion";
export function PlayerAvatar({
  outfit = "mint",
  moving = false,
  diving = false,
  svg = false,
  width = 144,
  height = 192,
  className,
}: {
  outfit?: Outfit;
  moving?: boolean;
  diving?: boolean;
  svg?: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const url = characterUrl(outfit, moving ? (diving ? "swim" : "walk") : "idle", diving, reduced);
  return svg ? (
    <image
      data-avatar={outfit}
      x={-width / 2}
      y={-height * 0.86}
      width={width}
      height={height}
      href={url}
    />
  ) : (
    <img data-avatar={outfit} className={className} src={url} alt="" draggable={false} />
  );
}
