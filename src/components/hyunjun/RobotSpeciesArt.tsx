import type { CSSProperties } from "react";
import type { RobotSpecies } from "@/game/robot-catalog";

// Machine robots for the robot fusion world: visor and lamp eyes, never a human face.
// Drawn in a 120×150 box so a fusion can place several bodies in one picture.
function RobotBody({ robot, grade = 0 }: { robot: RobotSpecies; grade?: number }) {
  const { color, accent, family, mark } = robot;
  return (
    <g>
      {family === "sky" && (
        <g fill={accent} stroke={color} strokeWidth="4" strokeLinejoin="round">
          <path d="M34 66L4 50L10 86L34 84Z" />
          <path d="M86 66L116 50L110 86L86 84Z" />
        </g>
      )}
      {family === "fire" && (
        <g>
          <rect
            x="82"
            y="40"
            width="12"
            height="62"
            rx="3"
            fill="#ffd36b"
            stroke="#a5682d"
            strokeWidth="3"
          />
          <path d="M82 52h12M82 66h12M82 80h12" stroke="#a5682d" strokeWidth="3" />
        </g>
      )}
      <g className="hj-mech-leg left">
        <rect x="38" y="104" width="17" height="34" rx="5" fill={color} />
        <rect x="34" y="132" width="25" height="9" rx="3" fill="#3d4650" />
      </g>
      <g className="hj-mech-leg right">
        <rect x="65" y="104" width="17" height="34" rx="5" fill={color} />
        <rect x="61" y="132" width="25" height="9" rx="3" fill="#3d4650" />
      </g>
      <rect
        x="18"
        y="62"
        width="15"
        height="40"
        rx="6"
        fill={color}
        stroke="#2f3a44"
        strokeWidth="3"
      />
      <rect
        x="87"
        y="62"
        width="15"
        height="40"
        rx="6"
        fill={color}
        stroke="#2f3a44"
        strokeWidth="3"
      />
      <rect
        x="30"
        y="56"
        width="60"
        height="52"
        rx="10"
        fill={color}
        stroke="#2f3a44"
        strokeWidth="4"
      />
      <rect x="40" y="66" width="40" height="22" rx="5" fill={accent} />
      {family === "police" && (
        <path
          d="M60 69l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"
          fill="#f7c948"
          stroke="#2f3a44"
          strokeWidth="2"
        />
      )}
      {family === "fire" && (
        <circle cx="60" cy="77" r="8" fill="#e05a4f" stroke="#2f3a44" strokeWidth="2" />
      )}
      {family === "sky" && (
        <path d="M46 82l14-12 14 12" fill="none" stroke={color} strokeWidth="5" />
      )}
      <rect
        x="34"
        y="20"
        width="52"
        height="36"
        rx="9"
        fill={color}
        stroke="#2f3a44"
        strokeWidth="4"
      />
      <rect x="40" y="30" width="40" height="14" rx="5" fill="#1f2a33" />
      <rect className="hj-mech-eye" x="45" y="34" width="10" height="6" rx="2" fill="#7ff3ff" />
      <rect className="hj-mech-eye" x="65" y="34" width="10" height="6" rx="2" fill="#7ff3ff" />
      {family === "police" && (
        <g>
          <rect x="48" y="8" width="24" height="12" rx="4" fill="#2f3a44" />
          <rect x="50" y="10" width="9" height="8" rx="2" fill="#ff5d5d" />
          <rect x="61" y="10" width="9" height="8" rx="2" fill="#5d9bff" />
        </g>
      )}
      {family === "fire" && (
        <path d="M44 20h32l-4-10H48z" fill="#ffd36b" stroke="#2f3a44" strokeWidth="3" />
      )}
      {family === "sky" && (
        <path d="M60 4l8 16H52z" fill={accent} stroke="#2f3a44" strokeWidth="3" />
      )}
      {mark === "bolt" && (
        <g fill="#ffe45c" stroke="#2f3a44" strokeWidth="2">
          <path d="M14 56l8-10-2 8h6l-8 12 2-10z" />
          <path d="M98 56l8-10-2 8h6l-8 12 2-10z" />
        </g>
      )}
      {mark === "lava" && (
        <path d="M34 98l10-8 6 6 10-10 8 8 8-6 8 10" fill="none" stroke="#ffb347" strokeWidth="4" />
      )}
      {mark === "laser" && (
        <g>
          <rect x="88" y="94" width="26" height="8" rx="3" fill="#2f3a44" />
          <rect x="112" y="95" width="6" height="6" rx="2" fill="#9ef3ff" />
        </g>
      )}
      {grade >= 2 && (
        // 강철: riveted steel plates on chest and legs.
        <g fill="#d5dde3" stroke="#6b7680" strokeWidth="2">
          <rect x="32" y="90" width="16" height="14" rx="3" />
          <rect x="72" y="90" width="16" height="14" rx="3" />
          <rect x="38" y="112" width="17" height="10" rx="2" />
          <rect x="65" y="112" width="17" height="10" rx="2" />
          <g fill="#6b7680" stroke="none">
            <circle cx="36" cy="94" r="1.6" />
            <circle cx="84" cy="94" r="1.6" />
          </g>
        </g>
      )}
      {grade >= 1 && (
        <g fill="#f5c542" stroke="#8a6a12" strokeWidth="2">
          <rect x="14" y="54" width="22" height="12" rx="5" />
          <rect x="84" y="54" width="22" height="12" rx="5" />
          <path d="M50 22l10-12 10 12z" />
        </g>
      )}
    </g>
  );
}
/** The robot's own weapon, drawn out of its right arm when used. */
function DrawnWeapon({ robot }: { robot: RobotSpecies }) {
  const kind = robot.weapon.kind;
  return (
    <g className="hj-solo-weapon">
      {kind === "sword" && (
        <g>
          <rect x="96" y="84" width="8" height="12" rx="2" fill="#f5c542" />
          <rect x="97" y="20" width="6" height="66" rx="3" fill="#9ef3ff" stroke="#2f8fd8" />
        </g>
      )}
      {kind === "cannon" && (
        <g>
          <rect x="96" y="80" width="26" height="12" rx="4" fill="#5b6670" />
          <path d="M122 86q10-8 14-2q-2 8-14 6z" fill="#9fe2ff" />
        </g>
      )}
      {kind === "wind" && (
        <g transform="translate(112 72)">
          <path
            className="hj-solo-spin"
            d="M0-16q8 8 0 16q-8 8-16 0q8-8 16-16z M0 0q16 4 12 14q-10 0-12-14z"
            fill="#b9fff2"
            stroke={robot.color}
            strokeWidth="2"
          />
        </g>
      )}
    </g>
  );
}
export function RobotSpeciesArt({
  robot,
  grade = 0,
  moving = false,
  weaponOut = false,
  size = 96,
  label = robot.name,
}: {
  robot: RobotSpecies;
  grade?: number;
  moving?: boolean;
  weaponOut?: boolean;
  size?: number;
  label?: string;
}) {
  return (
    <svg
      className={`hj-mech${moving ? " moving" : ""}`}
      viewBox="0 0 140 150"
      width={size * (140 / 120)}
      height={size * 1.25}
      role="img"
      aria-label={label}
      data-weapon={weaponOut ? "drawn" : "stowed"}
    >
      <ellipse cx="60" cy="144" rx="34" ry="5" fill="#355e6426" />
      <RobotBody robot={robot} grade={grade} />
      {weaponOut && <DrawnWeapon robot={robot} />}
    </svg>
  );
}
/** The villain from the made-up rusty gear empire: one red lamp, gear head, spiky shoulders. */
export function VillainArt({ retreating, style }: { retreating: boolean; style?: CSSProperties }) {
  const body = retreating ? "#9a9a9a" : "#8a5a44";
  return (
    <svg
      className={`hj-villain-art${retreating ? " retreating" : ""}`}
      viewBox="0 0 130 160"
      width="104"
      height="128"
      role="img"
      aria-label={retreating ? "고장 나서 수리하러 가는 악당 로봇" : "녹슨 톱니 악당 로봇"}
      style={style}
    >
      <ellipse cx="65" cy="154" rx="38" ry="5" fill="#355e6426" />
      <rect x="40" y="110" width="18" height="38" rx="4" fill="#5b3d31" />
      <rect x="72" y="110" width="18" height="38" rx="4" fill="#5b3d31" />
      <path
        d="M22 60l18-12v50H22z M108 60l-18-12v50h18z"
        fill="#6e4a3b"
        stroke="#2f2a28"
        strokeWidth="3"
      />
      <path
        d="M16 58l10-16 10 16z M94 58l10-16 10 16z"
        fill="#b8b8b8"
        stroke="#2f2a28"
        strokeWidth="2"
      />
      <rect
        x="36"
        y="56"
        width="58"
        height="58"
        rx="6"
        fill={body}
        stroke="#2f2a28"
        strokeWidth="4"
      />
      <path d="M48 74h34M48 86h34M48 98h34" stroke="#5b3d31" strokeWidth="4" />
      <g transform="translate(65 32)">
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x="-5"
            y="-30"
            width="10"
            height="12"
            fill={body}
            transform={`rotate(${i * 45})`}
          />
        ))}
        <circle r="22" fill={body} stroke="#2f2a28" strokeWidth="4" />
        <rect x="-15" y="-5" width="30" height="10" rx="4" fill="#2a1d1a" />
        <circle r="4" fill={retreating ? "#555" : "#ff4b3e"} />
      </g>
      {retreating && (
        <g fill="#d9d9d9" opacity=".85">
          <circle cx="40" cy="12" r="9" />
          <circle cx="54" cy="4" r="6" />
          <circle cx="98" cy="18" r="8" />
          <path d="M60 60l6-8 4 10 6-6" stroke="#ffd36b" strokeWidth="3" fill="none" />
        </g>
      )}
    </svg>
  );
}
export function WorkshopArt() {
  return (
    <svg viewBox="0 0 150 120" width="132" height="106" role="img" aria-label="로봇 정비소">
      <ellipse cx="75" cy="114" rx="62" ry="6" fill="#355e6426" />
      <path d="M10 48L75 10l65 38v64H10z" fill="#7aa6c9" stroke="#2f3a44" strokeWidth="4" />
      <rect
        x="40"
        y="58"
        width="70"
        height="54"
        rx="4"
        fill="#dfe8ef"
        stroke="#2f3a44"
        strokeWidth="3"
      />
      <path d="M40 72h70M40 86h70M40 100h70" stroke="#a9b8c4" strokeWidth="3" />
      <g transform="translate(75 34) rotate(-35)">
        <rect
          x="-4"
          y="-16"
          width="8"
          height="30"
          rx="3"
          fill="#f5c542"
          stroke="#2f3a44"
          strokeWidth="2"
        />
        <circle cy="-18" r="8" fill="#f5c542" stroke="#2f3a44" strokeWidth="2" />
        <circle cy="-21" r="4" fill="#7aa6c9" />
      </g>
    </svg>
  );
}
