import { useId, type JSX } from "react";
import { LEGENDS, type LegendId } from "@/game/robot-catalog";
import "./robot-giant.css";

// Six legendary robots. Each has its own silhouette so a child can tell them apart even when
// small: a wide shield guardian, a winged flyer, a round deep-sea diver, a tank-tread heavy, a
// spiky thunder mech and a tall haloed guardian. Visor and lamp eyes only, never a human face.
// Base frame: body centred on x=100, feet on y=200.

export type { LegendId };

// Shared look data for other code (spec asks this file to own it).
export const LEGEND_LOOK = Object.fromEntries(
  LEGENDS.map((l) => [l.id, { name: l.name, color: l.color, accent: l.accent }]),
) as Record<LegendId, { name: string; color: string; accent: string }>;

const OUTLINE = "#2f3a44";
const JOINT = "#3d4650";
const GOLD = "#f5c542";
const GOLD_DARK = "#8a6a12";
const SILVER = "#d9dfe5";
const SILVER_DARK = "#7d8790";
const EYE = "#7ff3ff";
const VISOR = "#1f2a33";
const MIRROR = "translate(200 0) scale(-1 1)";

type Parts = { grade: number; out: boolean };

function Visor({
  x,
  y,
  w,
  h,
  grade,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  grade: number;
}) {
  const ew = Math.max(5, w * 0.28);
  const eh = Math.max(3.5, h * 0.42);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 3}
        fill={VISOR}
        stroke={grade >= 1 ? GOLD : "none"}
        strokeWidth="2"
      />
      <rect
        className="hj-lg-eye"
        x={x + w * 0.14}
        y={y + (h - eh) / 2}
        width={ew}
        height={eh}
        rx="1.6"
        fill={EYE}
      />
      <rect
        className="hj-lg-eye"
        x={x + w * 0.86 - ew}
        y={y + (h - eh) / 2}
        width={ew}
        height={eh}
        rx="1.6"
        fill={EYE}
      />
    </g>
  );
}

function Rivets({ points, fill = SILVER_DARK }: { points: [number, number][]; fill?: string }) {
  return (
    <g fill={fill}>
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />
      ))}
    </g>
  );
}

/** Gold trim band (grade 1+) and riveted steel side plates (grade 2+) across a chest box. */
function GradeDeco({ grade, x, y, w }: { grade: number; x: number; y: number; w: number }) {
  return (
    <g>
      {grade >= 1 && (
        <g>
          <rect
            x={x}
            y={y - 3}
            width={w}
            height="6"
            rx="3"
            fill={GOLD}
            stroke={GOLD_DARK}
            strokeWidth="1.5"
          />
          <path
            d={`M${x + w / 2 - 6} ${y - 3}l6-8 6 8z`}
            fill={GOLD}
            stroke={GOLD_DARK}
            strokeWidth="1.5"
          />
        </g>
      )}
      {grade >= 2 && (
        <g fill={SILVER} stroke={SILVER_DARK} strokeWidth="1.5">
          <rect x={x + 1} y={y + 6} width="9" height="22" rx="2" />
          <rect x={x + w - 10} y={y + 6} width="9" height="22" rx="2" />
          <Rivets
            points={[
              [x + 5.5, y + 10],
              [x + 5.5, y + 24],
              [x + w - 5.5, y + 10],
              [x + w - 5.5, y + 24],
            ]}
          />
        </g>
      )}
    </g>
  );
}

function Core({ cx, cy, r = 6 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill="#ffffff" opacity=".35" />
      <circle
        className="hj-lg-core"
        cx={cx}
        cy={cy}
        r={r}
        fill="#c9fbff"
        stroke={OUTLINE}
        strokeWidth="2"
      />
    </g>
  );
}

// ── lg-shield: wide, square-shouldered guardian with a tower shield on its left arm. ──
function ShieldBot({ grade, out }: Parts) {
  const { color, accent } = LEGEND_LOOK["lg-shield"];
  const deep = "#24438a";
  return (
    <g>
      <g className="hj-lg-leg l">
        <rect
          x="70"
          y="148"
          width="26"
          height="42"
          rx="5"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="4"
        />
        <rect
          x="62"
          y="184"
          width="38"
          height="14"
          rx="4"
          fill={deep}
          stroke={OUTLINE}
          strokeWidth="3"
        />
      </g>
      <g className="hj-lg-leg r">
        <rect
          x="104"
          y="148"
          width="26"
          height="42"
          rx="5"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="4"
        />
        <rect
          x="100"
          y="184"
          width="38"
          height="14"
          rx="4"
          fill={deep}
          stroke={OUTLINE}
          strokeWidth="3"
        />
      </g>
      <rect
        x="40"
        y="96"
        width="22"
        height="50"
        rx="6"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="38"
        y="140"
        width="26"
        height="18"
        rx="5"
        fill={deep}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <rect
        x="56"
        y="76"
        width="88"
        height="78"
        rx="8"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="68"
        y="88"
        width="64"
        height="40"
        rx="5"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path d="M78 96h44l-22 24z" fill="#9cc0ff" stroke={deep} strokeWidth="2" />
      <Core cx={100} cy={140} />
      <rect
        x="30"
        y="66"
        width="38"
        height="32"
        rx="4"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="132"
        y="66"
        width="38"
        height="32"
        rx="4"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <Rivets
        points={[
          [36, 72],
          [62, 72],
          [138, 72],
          [164, 72],
        ]}
        fill={SILVER}
      />
      <rect x="92" y="72" width="16" height="8" fill={JOINT} />
      <rect
        x="74"
        y="32"
        width="52"
        height="44"
        rx="6"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="74"
        y="32"
        width="52"
        height="10"
        rx="5"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <Visor x={80} y={48} w={40} h={14} grade={grade} />
      <rect x="84" y="66" width="32" height="5" rx="2" fill={SILVER_DARK} />
      <GradeDeco grade={grade} x={68} y={88} w={64} />
      {/* Tower shield strapped to the robot's left arm (viewer's right). */}
      <g className={`hj-lg-weapon${out ? " out" : ""}`}>
        <g transform={out ? "translate(8 -6)" : undefined}>
          {out && (
            <g className="hj-lg-glow">
              <path d="M134 56h72v104q0 32-36 44q-36-12-36-44z" fill="#9cc0ff" opacity=".45" />
              <path
                d="M214 80q12 40 0 80M224 70q16 50 0 100"
                fill="none"
                stroke="#9cc0ff"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          )}
          <path
            d="M140 62h60v96q0 26-30 38q-30-12-30-38z"
            fill={accent}
            stroke={OUTLINE}
            strokeWidth="4"
          />
          <path
            d="M148 70h44v86q0 20-22 30q-22-10-22-30z"
            fill={color}
            stroke={deep}
            strokeWidth="2.5"
          />
          <path d="M170 82l8 22h-6v40h-4v-40h-6z" fill={accent} stroke={deep} strokeWidth="2" />
          <Rivets
            points={[
              [146, 68],
              [194, 68],
              [146, 150],
              [194, 150],
            ]}
            fill={deep}
          />
        </g>
      </g>
    </g>
  );
}

// ── lg-wing: slim body with big swept mechanical wings and a V-fin head. ──
function WingHalf({ color, accent }: { color: string; accent: string }) {
  return (
    <g>
      <path
        d="M92 94L14 18l10 34L-4 50l26 30L2 92l40 18L28 126l58-8z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M86 98L22 40M84 104L14 74M84 110L20 96" stroke={accent} strokeWidth="4" />
    </g>
  );
}

function WingBot({ grade, out }: Parts) {
  const { color, accent } = LEGEND_LOOK["lg-wing"];
  const deep = "#11756d";
  return (
    <g>
      <g className="hj-lg-wings">
        <WingHalf color={color} accent={accent} />
        <g transform={MIRROR}>
          <WingHalf color={color} accent={accent} />
        </g>
      </g>
      <g className="hj-lg-leg l">
        <rect
          x="86"
          y="138"
          width="12"
          height="52"
          rx="4"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
        <path d="M80 198l8-12h10v12z" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <g className="hj-lg-leg r">
        <rect
          x="102"
          y="138"
          width="12"
          height="52"
          rx="4"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
        <path d="M120 198l-8-12h-10v12z" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <rect
        x="68"
        y="88"
        width="11"
        height="46"
        rx="5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <rect
        x="121"
        y="88"
        width="11"
        height="46"
        rx="5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <path
        d="M78 82h44l-8 58H86z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M84 90l16 22 16-22"
        fill="none"
        stroke={accent}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <Core cx={100} cy={126} r={5} />
      <rect x="94" y="74" width="12" height="9" fill={JOINT} />
      <path
        d="M100 52L72 22h9l19 20 19-20h9z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="86"
        y="44"
        width="28"
        height="32"
        rx="8"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <Visor x={89} y={54} w={22} h={10} grade={grade} />
      <GradeDeco grade={grade} x={84} y={90} w={32} />
      {out ? (
        <g className="hj-lg-weapon out">
          <g transform="translate(140 128)">
            <circle className="hj-lg-glow" r="22" fill="#bff6ec" opacity=".55" />
            {[-70, -35, 0, 35, 70].map((a) => (
              <path
                key={a}
                className="hj-lg-feather"
                d="M0 0C6-8 30-12 52-2C30 2 10 4 0 0z"
                transform={`rotate(${a})`}
                fill={color}
                stroke={deep}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            ))}
            <circle r="6" fill={accent} stroke={OUTLINE} strokeWidth="2" />
          </g>
        </g>
      ) : (
        <path
          className="hj-lg-weapon"
          d="M124 140c4 6 4 18 0 24c-4-6-4-18 0-24z"
          fill={color}
          stroke={deep}
          strokeWidth="2"
        />
      )}
    </g>
  );
}

// ── lg-deep: round diver mech with a dome visor, fins and a propeller backpack. ──
function Propeller({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g className="hj-lg-prop">
        {[0, 120, 240].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-11"
            rx="6"
            ry="12"
            transform={`rotate(${a})`}
            fill="#4fd6e0"
            stroke={OUTLINE}
            strokeWidth="2.5"
          />
        ))}
      </g>
      <circle r="5" fill="#f5c542" stroke={OUTLINE} strokeWidth="2.5" />
    </g>
  );
}

function DeepBot({ grade, out }: Parts) {
  const { color, accent } = LEGEND_LOOK["lg-deep"];
  return (
    <g>
      <rect
        x="62"
        y="84"
        width="76"
        height="56"
        rx="14"
        fill="#1a2f5a"
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="40"
        y="70"
        width="10"
        height="34"
        rx="4"
        fill={JOINT}
        transform="rotate(-30 45 87)"
      />
      <rect
        x="150"
        y="70"
        width="10"
        height="34"
        rx="4"
        fill={JOINT}
        transform="rotate(30 155 87)"
      />
      <Propeller cx={34} cy={62} />
      <Propeller cx={166} cy={62} />
      <g className="hj-lg-leg l">
        <ellipse cx="82" cy="174" rx="14" ry="18" fill={color} stroke={OUTLINE} strokeWidth="4" />
        <ellipse cx="76" cy="194" rx="20" ry="7" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <g className="hj-lg-leg r">
        <ellipse cx="118" cy="174" rx="14" ry="18" fill={color} stroke={OUTLINE} strokeWidth="4" />
        <ellipse cx="124" cy="194" rx="20" ry="7" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <path d="M48 120l-18 10 18 12z" fill={accent} stroke={OUTLINE} strokeWidth="3" />
      <ellipse cx="56" cy="128" rx="13" ry="20" fill={color} stroke={OUTLINE} strokeWidth="4" />
      <ellipse cx="144" cy="128" rx="13" ry="20" fill={color} stroke={OUTLINE} strokeWidth="4" />
      <circle cx="100" cy="130" r="42" fill={color} stroke={OUTLINE} strokeWidth="4" />
      <circle cx="100" cy="136" r="24" fill={accent} stroke={OUTLINE} strokeWidth="2.5" />
      <path d="M82 140q18 10 36 0" fill="none" stroke={color} strokeWidth="3" />
      <Core cx={100} cy={130} r={6} />
      <Rivets
        points={[
          [66, 112],
          [134, 112],
          [70, 152],
          [130, 152],
        ]}
        fill="#7fa6d8"
      />
      <path d="M100 84l-8-14h16z" fill={accent} stroke={OUTLINE} strokeWidth="2.5" />
      <rect
        x="74"
        y="84"
        width="52"
        height="10"
        rx="5"
        fill="#f5c542"
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <circle cx="100" cy="62" r="28" fill="#bff4f8" stroke={OUTLINE} strokeWidth="4" />
      <path
        d="M84 48q8-10 22-8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Visor x={84} y={60} w={32} h={12} grade={grade} />
      <GradeDeco grade={grade} x={78} y={106} w={44} />
      {out ? (
        <g className="hj-lg-weapon out">
          <g className="hj-lg-glow" fill="#dff9ff" stroke="#4fd6e0" strokeWidth="2">
            <circle cx="160" cy="144" r="5" />
            <circle cx="170" cy="154" r="4" />
            <circle cx="152" cy="156" r="3.5" />
          </g>
          <path d="M150 124h36q14 6 0 12h-36z" fill="#f5c542" stroke={OUTLINE} strokeWidth="3" />
          <path d="M150 124l-8-6v24l8-6z" fill={accent} stroke={OUTLINE} strokeWidth="2.5" />
          <circle cx="204" cy="130" r="9" fill="#dff9ff" stroke="#4fd6e0" strokeWidth="2.5" />
          <circle cx="216" cy="120" r="5" fill="#dff9ff" stroke="#4fd6e0" strokeWidth="2" />
        </g>
      ) : (
        <path
          className="hj-lg-weapon"
          d="M148 140h16q6 3 0 6h-16z"
          fill="#f5c542"
          stroke={OUTLINE}
          strokeWidth="2"
        />
      )}
      <path d="M152 120l18 10-18 12z" fill={accent} stroke={OUTLINE} strokeWidth="3" />
    </g>
  );
}

// ── lg-steel: very heavy, wide, tank-tread base, riveted steel plates, big hammer fist. ──
function SteelBot({ grade, out }: Parts) {
  const { color, accent } = LEGEND_LOOK["lg-steel"];
  const dark = "#3b424b";
  return (
    <g>
      <g className="hj-lg-tread">
        <rect
          x="36"
          y="160"
          width="128"
          height="40"
          rx="20"
          fill={dark}
          stroke={OUTLINE}
          strokeWidth="4"
        />
        {[56, 81, 106, 131, 146].map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy="180"
            r="10"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="2.5"
          />
        ))}
        <path d="M46 164h108M46 196h108" stroke="#8a929b" strokeWidth="3" strokeDasharray="5 5" />
      </g>
      <rect
        x="24"
        y="96"
        width="30"
        height="50"
        rx="6"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="20"
        y="138"
        width="38"
        height="28"
        rx="6"
        fill={dark}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <path
        d="M42 70h116l-12 92H54z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="58"
        y="82"
        width="38"
        height="34"
        rx="3"
        fill="#6f7a86"
        stroke={dark}
        strokeWidth="2"
      />
      <rect
        x="104"
        y="82"
        width="38"
        height="34"
        rx="3"
        fill="#6f7a86"
        stroke={dark}
        strokeWidth="2"
      />
      <rect
        x="62"
        y="122"
        width="76"
        height="30"
        rx="3"
        fill="#6f7a86"
        stroke={dark}
        strokeWidth="2"
      />
      <path d="M62 138h76" stroke={accent} strokeWidth="6" />
      <Rivets
        points={[
          [62, 86],
          [92, 86],
          [62, 112],
          [92, 112],
          [108, 86],
          [138, 86],
          [108, 112],
          [138, 112],
          [66, 126],
          [134, 126],
          [66, 148],
          [134, 148],
        ]}
        fill="#2b3138"
      />
      <Core cx={100} cy={102} r={7} />
      <circle cx="44" cy="80" r="24" fill={color} stroke={OUTLINE} strokeWidth="4" />
      <circle cx="44" cy="80" r="14" fill="none" stroke={accent} strokeWidth="5" />
      <circle cx="156" cy="80" r="24" fill={color} stroke={OUTLINE} strokeWidth="4" />
      <circle cx="156" cy="80" r="14" fill="none" stroke={accent} strokeWidth="5" />
      <rect
        x="78"
        y="48"
        width="44"
        height="26"
        rx="5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect x="78" y="48" width="44" height="7" rx="3" fill={accent} />
      <Visor x={83} y={57} w={34} h={10} grade={grade} />
      <GradeDeco grade={grade} x={58} y={82} w={84} />
      <rect
        x="146"
        y="96"
        width="30"
        height="46"
        rx="6"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      {out ? (
        <g className="hj-lg-weapon out">
          <g className="hj-lg-glow" stroke={accent} strokeWidth="4" strokeLinecap="round">
            <path d="M206 120l12-8M210 146h14M206 170l12 8" />
          </g>
          <rect
            x="138"
            y="128"
            width="66"
            height="56"
            rx="10"
            fill={dark}
            stroke={OUTLINE}
            strokeWidth="4"
          />
          <path d="M150 140h44M150 156h44M150 172h44" stroke="#8a929b" strokeWidth="3" />
          <rect
            x="196"
            y="132"
            width="10"
            height="48"
            rx="4"
            fill={accent}
            stroke={OUTLINE}
            strokeWidth="3"
          />
        </g>
      ) : (
        <rect
          className="hj-lg-weapon"
          x="142"
          y="138"
          width="38"
          height="28"
          rx="6"
          fill={dark}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
      )}
    </g>
  );
}

// ── lg-thunder: spiky, lightning-bolt crest and coil shoulders, lightning lance. ──
function Coil({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <g>
      {[0, 9, 18].map((d) => (
        <ellipse
          key={d}
          cx={cx}
          cy={cy - 8 + d}
          rx="18"
          ry="6"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="3"
        />
      ))}
    </g>
  );
}

function ThunderBot({ grade, out }: Parts) {
  const { color, accent } = LEGEND_LOOK["lg-thunder"];
  const deep = "#4a2380";
  return (
    <g>
      {!out && (
        <g className="hj-lg-weapon">
          <rect
            x="128"
            y="40"
            width="7"
            height="110"
            rx="3"
            fill={deep}
            stroke={OUTLINE}
            strokeWidth="2"
            transform="rotate(16 131 95)"
          />
        </g>
      )}
      <g className="hj-lg-leg l">
        <path d="M80 138h16l-2 48H80z" fill={accent} stroke={OUTLINE} strokeWidth="4" />
        <path d="M76 154l-12-6 10 14z" fill={color} stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M70 198l8-14h18v14z" fill={deep} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <g className="hj-lg-leg r">
        <path d="M104 138h16l-2 48h-14z" fill={accent} stroke={OUTLINE} strokeWidth="4" />
        <path d="M124 154l12-6-10 14z" fill={color} stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M130 198l-8-14h-18v14z" fill={deep} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <rect
        x="54"
        y="92"
        width="14"
        height="46"
        rx="5"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <rect
        x="132"
        y="92"
        width="14"
        height="46"
        rx="5"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <path
        d="M68 80h64l-8 30 6 6-10 26H80l-10-26 6-6z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M104 88l-14 22h10l-6 20 18-26h-10l6-16z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="2"
      />
      <Core cx={100} cy={134} r={4.5} />
      <path
        d="M46 70l-10-18 18 8zM154 70l10-18-18 8z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <Coil cx={58} cy={84} color={color} />
      <Coil cx={142} cy={84} color={color} />
      <rect x="94" y="72" width="12" height="9" fill={JOINT} />
      <path
        d="M106 -6L80 34h14l-8 18 30-32h-14l10-26z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M80 44l20-10 20 10v24l-20 10-20-10z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M80 50l-10-4 6 12zM120 50l10-4-6 12z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="2"
      />
      <Visor x={85} y={50} w={30} h={11} grade={grade} />
      <GradeDeco grade={grade} x={78} y={86} w={44} />
      {out && (
        <g className="hj-lg-weapon out">
          <g transform="rotate(20 140 150)">
            <rect
              x="136"
              y="44"
              width="8"
              height="120"
              rx="3"
              fill={deep}
              stroke={OUTLINE}
              strokeWidth="2.5"
            />
            <path
              d="M140 0l12 46h-24z"
              fill={color}
              stroke={OUTLINE}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              className="hj-lg-glow"
              d="M140 4l-10 14 12 4-12 14 12 4-10 14M140 4l10 14-12 4 12 14-12 4 10 14"
              fill="none"
              stroke="#fff27a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <rect
              x="130"
              y="44"
              width="20"
              height="6"
              rx="2"
              fill={accent}
              stroke={OUTLINE}
              strokeWidth="2"
            />
          </g>
        </g>
      )}
    </g>
  );
}

// ── lg-guardian: tall regal mech with a gear-crown halo ring and cape panels. ──
function GuardianBot({ grade, out }: Parts) {
  const { color, accent } = LEGEND_LOOK["lg-guardian"];
  const deep = "#9c7414";
  const teeth = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <g>
      <path
        d="M74 80L34 198h132L126 80z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M74 80L50 198M100 80v118M126 80l24 118" stroke={color} strokeWidth="3" />
      <path d="M34 198h132" stroke={color} strokeWidth="5" />
      <g className="hj-lg-halo">
        <g transform="translate(100 20)">
          {teeth.map((a) => (
            <rect
              key={a}
              x="-4"
              y="-27"
              width="8"
              height="9"
              rx="1.5"
              fill={color}
              stroke={deep}
              strokeWidth="1.5"
              transform={`rotate(${a})`}
            />
          ))}
          <circle r="21" fill="none" stroke={OUTLINE} strokeWidth="9" />
          <circle r="21" fill="none" stroke={color} strokeWidth="6" />
        </g>
      </g>
      <g className="hj-lg-leg l">
        <rect
          x="84"
          y="138"
          width="14"
          height="52"
          rx="4"
          fill={accent}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
        <path d="M78 198v-10h20v10z" fill={color} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <g className="hj-lg-leg r">
        <rect
          x="102"
          y="138"
          width="14"
          height="52"
          rx="4"
          fill={accent}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
        <path d="M102 198v-10h20v10z" fill={color} stroke={OUTLINE} strokeWidth="3" />
      </g>
      <rect
        x="64"
        y="86"
        width="12"
        height="50"
        rx="5"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <rect
        x="124"
        y="86"
        width="12"
        height="50"
        rx="5"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      <rect
        x="76"
        y="76"
        width="48"
        height="66"
        rx="8"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path d="M82 84h36l-18 26z" fill={color} stroke={deep} strokeWidth="2" />
      <Core cx={100} cy={124} r={6} />
      <path
        d="M58 82q10-14 24-8v14H62zM142 82q-10-14-24-8v14h20z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <rect x="94" y="70" width="12" height="8" fill={JOINT} />
      <rect
        x="84"
        y="34"
        width="32"
        height="38"
        rx="7"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path d="M84 40h32" stroke={color} strokeWidth="4" />
      <Visor x={88} y={48} w={24} h={10} grade={grade} />
      <GradeDeco grade={grade} x={80} y={84} w={40} />
      {out ? (
        <g className="hj-lg-weapon out">
          <g transform="translate(162 112)">
            <circle className="hj-lg-glow" r="34" fill="#fff6b8" opacity=".5" />
            <circle r="22" fill="none" stroke={OUTLINE} strokeWidth="9" />
            <circle className="hj-lg-ring" r="22" fill="none" stroke="#fffbe0" strokeWidth="6" />
            <g stroke={color} strokeWidth="3" strokeLinecap="round">
              <path d="M0-30v-8M0 30v8M-30 0h-8M30 0h8M21-21l6-6M-21 21l-6 6M21 21l6 6M-21-21l-6-6" />
            </g>
          </g>
        </g>
      ) : (
        <circle
          className="hj-lg-weapon"
          cx="100"
          cy="146"
          r="7"
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
      )}
    </g>
  );
}

const BODIES: Record<LegendId, (p: Parts) => JSX.Element> = {
  "lg-shield": ShieldBot,
  "lg-wing": WingBot,
  "lg-deep": DeepBot,
  "lg-steel": SteelBot,
  "lg-thunder": ThunderBot,
  "lg-guardian": GuardianBot,
};

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
  const Body = BODIES[legend];
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
      <g className="hj-lg-body">
        <Body grade={g} out={weaponOut} />
      </g>
    </svg>
  );
}
