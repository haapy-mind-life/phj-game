import type { RobotSpecies } from "@/game/robot-catalog";

// Machine robots for the robot fusion world: visor and lamp eyes, never a human face.
export function RobotSpeciesArt({
  robot,
  moving = false,
  size = 96,
  label = robot.name,
}: {
  robot: RobotSpecies;
  moving?: boolean;
  size?: number;
  label?: string;
}) {
  const { color, accent, family, mark } = robot;
  return (
    <svg
      className={`hj-mech${moving ? " moving" : ""}`}
      viewBox="0 0 120 150"
      width={size}
      height={size * 1.25}
      role="img"
      aria-label={label}
    >
      <ellipse cx="60" cy="144" rx="34" ry="5" fill="#355e6426" />
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
    </svg>
  );
}
