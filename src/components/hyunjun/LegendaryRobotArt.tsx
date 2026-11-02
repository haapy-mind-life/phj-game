import { useId } from "react";
import { LEGENDS, type LegendId } from "@/game/robot/robot-catalog";
import { LEGEND_BODIES } from "./LegendBodies";
import "./robot-giant.css";

// The frame every legend stands in: card size, gold aura and the states browser checks read.
// The bodies themselves are in LegendBodies.tsx.

export type { LegendId };

// Shared look data for other code (spec asks this file to own it).
export const LEGEND_LOOK = Object.fromEntries(
  LEGENDS.map((l) => [l.id, { name: l.name, color: l.color, accent: l.accent }]),
) as Record<LegendId, { name: string; color: string; accent: string }>;

const GOLD = "#f5c542";

export function LegendaryRobotArt({
  legend,
  size = 96,
  moving = false,
  weaponOut = false,
  grade = 0,
  label,
}: {
  legend: LegendId;
  size?: number;
  moving?: boolean;
  weaponOut?: boolean;
  grade?: number;
  label?: string;
}) {
  const rawId = useId();
  const auraId = `hjla-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const look = LEGEND_LOOK[legend];
  const g = Math.max(0, Math.min(2, Math.floor(grade)));
  return (
    <svg
      className={`hj-legend ${legend}${moving ? " moving" : ""}${weaponOut ? " weapon-out" : ""}`}
      viewBox="-24 -24 248 230"
      width={size}
      height={(size * 230) / 248}
      role="img"
      aria-label={label ?? look.name}
      data-legend={legend}
      data-weapon={weaponOut ? "drawn" : "stowed"}
    >
      <defs>
        <radialGradient id={auraId}>
          <stop offset="0" stopColor="#fff6b8" stopOpacity=".85" />
          <stop offset=".6" stopColor="#ffe27a" stopOpacity=".35" />
          <stop offset="1" stopColor={look.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="hj-lg-aura">
        <circle cx="100" cy="108" r="104" fill={`url(#${auraId})`} />
        <circle
          className="hj-lg-aura-ring"
          cx="100"
          cy="108"
          r="96"
          fill="none"
          stroke={GOLD}
          strokeWidth="3"
          strokeDasharray="14 10"
          opacity=".75"
        />
      </g>
      <ellipse cx="100" cy="201" rx="58" ry="6" fill="#355e6426" />
      <g className="hj-lg-body">{LEGEND_BODIES[legend]({ grade: g, out: weaponOut })}</g>
    </svg>
  );
}
