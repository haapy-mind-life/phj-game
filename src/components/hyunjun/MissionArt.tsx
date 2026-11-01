import { useId } from "react";
import "./robot-fusion.css";

// Mission props for the robot world: a sneaky thief robot (still a machine — visor stripe, lamp
// eyes, no human face), a cartoon flame bush blocking a friend, and the watch summon beam.

const OUTLINE = "#2a2238";
type ThiefPhase = "fleeing" | "stunned" | "caught" | "retreating";
const THIEF_LABEL: Record<ThiefPhase, string> = {
  fleeing: "도망가는 도둑 로봇",
  stunned: "어지러운 도둑 로봇",
  caught: "잡힌 도둑 로봇",
  retreating: "돌아가는 도둑 로봇",
};

export function ThiefRobotArt({
  phase,
  moving = false,
  size = 96,
}: {
  phase: ThiefPhase;
  moving?: boolean;
  size?: number;
}) {
  const gray = phase === "retreating";
  const body = gray ? "#9a9aa4" : "#6a4aa0";
  const dark = gray ? "#6c6c74" : "#3a2a58";
  const sack = gray ? "#b7b0a6" : "#c09062";
  const facing = phase === "retreating" ? "translate(120 0) scale(-1 1)" : undefined;
  const lean = phase === "fleeing" ? "rotate(8 60 120)" : undefined;
  return (
    <svg
      className={`hj-thief phase-${phase}${moving ? " moving" : ""}`}
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      role="img"
      aria-label={THIEF_LABEL[phase]}
    >
      <ellipse cx="60" cy="124" rx="30" ry="4" fill="#355e6426" />
      {phase === "fleeing" && (
        <g stroke="#b9a6dc" strokeWidth="3" strokeLinecap="round">
          <path d="M4 58h16M0 74h18M6 90h14" />
        </g>
      )}
      <g transform={facing}>
        <g transform={lean}>
          <g className="hj-thief-leg left">
            <rect x="44" y="92" width="12" height="24" rx="4" fill={dark} />
            <rect x="40" y="112" width="18" height="8" rx="3" fill={OUTLINE} />
          </g>
          <g className="hj-thief-leg right">
            <rect x="64" y="92" width="12" height="24" rx="4" fill={dark} />
            <rect x="62" y="112" width="18" height="8" rx="3" fill={OUTLINE} />
          </g>
          <path
            d="M14 54q-4 30 18 34q22-4 18-34q-4-10-18-10q-14 0-18 10z"
            fill={sack}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <path d="M26 46q6-6 12 0" fill="none" stroke={OUTLINE} strokeWidth="3" />
          <path
            d="M32 58l3.5 7 7.5.8-5.6 5 1.6 7.6-7-4-7 4 1.6-7.6-5.6-5 7.5-.8z"
            fill={gray ? "#dedede" : "#ffd84a"}
            stroke={OUTLINE}
            strokeWidth="1.5"
          />
          <rect
            x="42"
            y="56"
            width="36"
            height="38"
            rx="9"
            fill={body}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <rect x="44" y="84" width="32" height="6" fill={dark} />
          <rect
            x="34"
            y="58"
            width="12"
            height="26"
            rx="5"
            fill={body}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <rect
            x="74"
            y="58"
            width="12"
            height="26"
            rx="5"
            fill={body}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <rect
            x="40"
            y="22"
            width="40"
            height="34"
            rx="11"
            fill={body}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <path d="M60 22v-8" stroke={OUTLINE} strokeWidth="3" />
          <circle cx="60" cy="12" r="4" fill={gray ? "#bbb" : "#ff6bd5"} />
          {phase === "retreating" ? (
            <g>
              <rect x="46" y="30" width="28" height="14" rx="4" fill={dark} />
              <path d="M50 37h20" stroke="#8a8a92" strokeWidth="2" />
            </g>
          ) : (
            <g>
              <path d="M34 30h52l-2 14H36z" fill="#14101c" />
              <path d="M84 32l10-4-2 8z" fill="#14101c" />
              {phase === "stunned" ? (
                <g fill="none" stroke="#ffe45c" strokeWidth="2">
                  <path d="M50 37a3 3 0 1 1 3 0a5 5 0 1 1-6-2" />
                  <path d="M68 37a3 3 0 1 1 3 0a5 5 0 1 1-6-2" />
                </g>
              ) : (
                <g fill="#ffe45c">
                  <rect x="45" y="34" width="11" height="5" rx="2" />
                  <rect x="64" y="34" width="11" height="5" rx="2" />
                </g>
              )}
            </g>
          )}
        </g>
      </g>
      {phase === "stunned" && (
        <g transform="translate(60 18)">
          <g className="hj-thief-dizzy" fill="#ffe45c" stroke="#a07a10" strokeWidth="1">
            <path d="M-26 0l2 4 4 .4-3 2.6 1 4-4-2.2-4 2.2 1-4-3-2.6 4-.4z" />
            <path d="M24 -2l2 4 4 .4-3 2.6 1 4-4-2.2-4 2.2 1-4-3-2.6 4-.4z" />
            <path d="M0 -12l2 4 4 .4-3 2.6 1 4-4-2.2-4 2.2 1-4-3-2.6 4-.4z" />
          </g>
        </g>
      )}
      {phase === "caught" && (
        <g className="hj-thief-net">
          <ellipse
            cx="60"
            cy="70"
            rx="52"
            ry="58"
            fill="#5db8ff22"
            stroke="#3a9bff"
            strokeWidth="4"
          />
          <g stroke="#7cc8ff" strokeWidth="2" opacity=".85">
            <path d="M22 30l76 80M8 60l64 66M40 14l70 72M98 30l-76 80M112 60l-64 66M80 14l-70 72" />
          </g>
          <ellipse
            className="hj-thief-ring"
            cx="60"
            cy="72"
            rx="44"
            ry="10"
            fill="none"
            stroke="#9ef3ff"
            strokeWidth="4"
          />
        </g>
      )}
      {phase === "retreating" && (
        <g className="hj-thief-smoke" fill="#d9d9d9" opacity=".9">
          <circle cx="92" cy="22" r="9" />
          <circle cx="104" cy="12" r="7" />
          <circle cx="98" cy="4" r="5" />
        </g>
      )}
    </svg>
  );
}

export function FirePatchArt({ out, size = 80 }: { out: boolean; size?: number }) {
  return (
    <svg
      className={`hj-firepatch${out ? " out" : ""}`}
      viewBox="0 0 100 90"
      width={size}
      height={(size * 90) / 100}
      role="img"
      aria-label={out ? "꺼진 덤불" : "불꽃 덤불"}
    >
      {out && <ellipse cx="50" cy="84" rx="44" ry="6" fill="#7cc4f0" opacity=".6" />}
      <ellipse cx="50" cy="84" rx="38" ry="4" fill="#355e6426" />
      <g fill={out ? "#5c6f45" : "#3f8f4a"} stroke="#24432a" strokeWidth="3">
        <circle cx="28" cy="66" r="16" />
        <circle cx="72" cy="66" r="16" />
        <circle cx="50" cy="58" r="20" />
        <rect x="14" y="66" width="72" height="18" rx="8" />
      </g>
      {out ? (
        <g>
          <g fill="#5db8ff" stroke="#2f7fc0" strokeWidth="1.5">
            <path d="M30 50q4 6 0 9q-4-3 0-9z" />
            <path d="M62 46q4 6 0 9q-4-3 0-9z" />
            <path d="M48 66q4 6 0 9q-4-3 0-9z" />
          </g>
          <g className="hj-firepatch-smoke" fill="#cfd4d8" opacity=".85">
            <circle cx="42" cy="28" r="9" />
            <circle cx="56" cy="20" r="7" />
            <circle cx="50" cy="8" r="5" />
          </g>
        </g>
      ) : (
        <g className="hj-firepatch-flames">
          <path
            className="hj-flame f1"
            d="M28 56q-12-18 2-34q0 12 8 14q2-10 8-14q4 18-6 34z"
            fill="#ff7a2f"
            stroke="#c2401c"
            strokeWidth="2"
          />
          <path
            className="hj-flame f2"
            d="M44 52q-12-24 6-46q2 16 10 18q4-8 6-12q8 24-8 40z"
            fill="#ff7a2f"
            stroke="#c2401c"
            strokeWidth="2"
          />
          <path
            className="hj-flame f3"
            d="M62 56q-8-16 4-30q2 10 8 12q4 10-4 18z"
            fill="#ff7a2f"
            stroke="#c2401c"
            strokeWidth="2"
          />
          <g fill="#ffd23f">
            <path d="M34 54q-6-10 2-18q2 8 6 10q0 6-8 8z" />
            <path d="M50 50q-6-14 4-26q4 12 8 14q0 10-12 12z" />
            <path d="M66 54q-4-8 2-14q4 6 4 10z" />
          </g>
        </g>
      )}
    </svg>
  );
}

export function SummonBeamArt({ color, size = 100 }: { color: string; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `hjsb-${uid}`;
  return (
    <svg
      className="hj-summon"
      viewBox="0 0 100 160"
      width={size}
      height={size * 1.6}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset=".6" stopColor={color} stopOpacity=".55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".95" />
        </linearGradient>
      </defs>
      <rect
        className="hj-summon-beam"
        x="28"
        y="0"
        width="44"
        height="146"
        rx="10"
        fill={`url(#${gradId})`}
      />
      <rect x="44" y="0" width="12" height="146" rx="6" fill="#ffffff" opacity=".7" />
      <ellipse
        className="hj-summon-ring r1"
        cx="50"
        cy="146"
        rx="40"
        ry="10"
        fill="none"
        stroke={color}
        strokeWidth="4"
      />
      <ellipse
        className="hj-summon-ring r2"
        cx="50"
        cy="146"
        rx="40"
        ry="10"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <g className="hj-summon-sparks" fill="#fff6b8">
        <path d="M18 100l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="M82 70l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="M76 120l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
        <path d="M24 50l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
      </g>
    </svg>
  );
}
