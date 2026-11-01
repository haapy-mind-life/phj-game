import { useId, type CSSProperties, type JSX, type ReactNode } from "react";
import { LEGEND_LOOK, type LegendId } from "./LegendaryRobotArt";
import "./robot-giant.css";

// The colossal "everyone together" robot, the rusty gear-empire villain giant it fights, and the
// villain's little minion bots. All machines: visors and lamp eyes only, never a human face.
// Giant frame: body centred on x=200, feet on y=420. "L" parts are on the viewer's left.

export type GiantPhase = "assembling" | "giant" | "splitting";
export type BossPhase = "idle" | "approach" | "telegraph" | "attack" | "stagger" | "retreat";

const OUTLINE = "#2f3a44";
const JOINT = "#3d4650";
const GOLD = "#f5c542";
const GOLD_DARK = "#8a6a12";
const EYE = "#7ff3ff";
const VISOR = "#1f2a33";
const SHADE = "#0000002a";
const LIGHT = "#ffffff40";
const MIRROR = "translate(400 0) scale(-1 1)";

const GIANT_PARTS = [
  "head",
  "chest",
  "shoulderL",
  "shoulderR",
  "armL",
  "armR",
  "handL",
  "handR",
  "waist",
  "legL",
  "legR",
  "back",
] as const;
type GiantPart = (typeof GIANT_PARTS)[number];
const FALLBACK_COLORS = [
  "#4f7fd1",
  "#e05a4f",
  "#3fb37f",
  "#f5a623",
  "#8a5cd1",
  "#2bb3c0",
  "#d1577f",
  "#7fb33f",
  "#c9a227",
  "#5a6470",
  "#3f6fd1",
  "#e0884f",
];

function uidOf(raw: string) {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Tiny robot-head bolt: shows the giant is built from many little robots. */
function MiniBolt({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x="-5"
        y="-4"
        width="10"
        height="8"
        rx="2.5"
        fill={LIGHT}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      <rect x="-3.5" y="-1.5" width="7" height="3" rx="1" fill={VISOR} />
      <circle cx="-1.7" cy="0" r=".9" fill={EYE} />
      <circle cx="1.7" cy="0" r=".9" fill={EYE} />
    </g>
  );
}

function Bolts({ points }: { points: [number, number][] }) {
  return (
    <g>
      {points.map(([x, y]) => (
        <MiniBolt key={`${x}-${y}`} x={x} y={y} />
      ))}
    </g>
  );
}

function GPart({ name, children }: { name: GiantPart; children: ReactNode }) {
  return (
    <g className={`hj-gpart hj-gpart-${name}`} data-gpart={name}>
      {children}
    </g>
  );
}

// ── Giant body pieces (drawn on the viewer-left; right side reuses them mirrored). ──

function GiantBack({ c }: { c: string }) {
  const half = (
    <g>
      <rect
        x="112"
        y="40"
        width="34"
        height="80"
        rx="10"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <rect
        x="108"
        y="34"
        width="42"
        height="14"
        rx="5"
        fill={JOINT}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect x="118" y="56" width="22" height="8" rx="3" fill={SHADE} />
      <rect x="118" y="72" width="22" height="8" rx="3" fill={SHADE} />
      <path d="M96 210h40l-6 36h-28z" fill={JOINT} stroke={OUTLINE} strokeWidth="4" />
      <ellipse className="hj-gthrust" cx="116" cy="252" rx="13" ry="7" fill="#ffd36b" />
    </g>
  );
  return (
    <g>
      <rect
        x="104"
        y="96"
        width="192"
        height="150"
        rx="24"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      {half}
      <g transform={MIRROR}>{half}</g>
    </g>
  );
}

function GiantLeg({ c }: { c: string }) {
  return (
    <g>
      <rect
        x="128"
        y="280"
        width="62"
        height="72"
        rx="12"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <rect x="136" y="290" width="46" height="14" rx="4" fill={SHADE} />
      <circle cx="159" cy="350" r="20" fill={JOINT} stroke={OUTLINE} strokeWidth="5" />
      <rect
        x="118"
        y="346"
        width="80"
        height="62"
        rx="12"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <path d="M128 358h60M128 372h60" stroke={SHADE} strokeWidth="5" />
      <rect
        x="100"
        y="398"
        width="104"
        height="26"
        rx="9"
        fill={JOINT}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <rect x="108" y="402" width="88" height="8" rx="3" fill={c} />
      <Bolts
        points={[
          [146, 322],
          [172, 322],
          [140, 390],
          [176, 390],
        ]}
      />
    </g>
  );
}

function GiantWaist({ c }: { c: string }) {
  return (
    <g>
      <rect
        x="136"
        y="238"
        width="128"
        height="54"
        rx="12"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <rect x="136" y="252" width="128" height="14" fill={SHADE} />
      <rect
        x="182"
        y="246"
        width="36"
        height="30"
        rx="6"
        fill={GOLD}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path d="M200 252l8 9-8 9-8-9z" fill={GOLD_DARK} />
      <Bolts
        points={[
          [152, 280],
          [166, 280],
          [234, 280],
          [248, 280],
        ]}
      />
    </g>
  );
}

function GiantChest({ c, coreId }: { c: string; coreId: string }) {
  return (
    <g>
      <path
        d="M110 106h180l-16 140H126z"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M126 118h56l-6 30h-44zM274 118h-56l6 30h44z"
        fill={LIGHT}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <path d="M140 212h120l-4 24H144z" fill={SHADE} />
      <path d="M150 220h100" stroke={OUTLINE} strokeWidth="3" strokeDasharray="10 6" />
      <circle cx="200" cy="176" r="46" fill={`url(#${coreId})`} />
      <circle cx="200" cy="176" r="34" fill={JOINT} stroke={OUTLINE} strokeWidth="5" />
      <circle
        className="hj-gcore"
        cx="200"
        cy="176"
        r="24"
        fill="#c9fbff"
        stroke="#3fd8ff"
        strokeWidth="4"
      />
      <circle cx="200" cy="176" r="10" fill="#ffffff" />
      <path
        d="M200 146v-6M200 212v-6M170 176h-6M236 176h-6"
        stroke={GOLD}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Bolts
        points={[
          [132, 168],
          [138, 196],
          [268, 168],
          [262, 196],
          [150, 134],
          [250, 134],
          [200, 126],
        ]}
      />
    </g>
  );
}

function GiantShoulder({ c }: { c: string }) {
  return (
    <g>
      <path
        d="M54 158q-6-70 60-72h36v72z"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M66 128q6-30 44-32"
        fill="none"
        stroke={LIGHT}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="M58 140h92" stroke={SHADE} strokeWidth="8" />
      <Bolts
        points={[
          [80, 116],
          [104, 104],
          [128, 102],
          [90, 150],
          [124, 150],
        ]}
      />
    </g>
  );
}

function GiantArm({ c }: { c: string }) {
  return (
    <g>
      <rect
        x="70"
        y="152"
        width="58"
        height="56"
        rx="12"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <circle cx="99" cy="210" r="16" fill={JOINT} stroke={OUTLINE} strokeWidth="4" />
      <rect
        x="64"
        y="212"
        width="70"
        height="48"
        rx="12"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <path d="M72 226h54" stroke={SHADE} strokeWidth="6" />
      <Bolts
        points={[
          [86, 176],
          [112, 176],
          [84, 244],
          [114, 244],
        ]}
      />
    </g>
  );
}

function GiantHand({ c }: { c: string }) {
  return (
    <g>
      <rect
        x="58"
        y="256"
        width="82"
        height="58"
        rx="16"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <path
        d="M78 290v20M98 290v22M118 290v20"
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="64" y="262" width="70" height="12" rx="5" fill={SHADE} />
      <rect
        x="128"
        y="270"
        width="20"
        height="30"
        rx="8"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="4"
      />
    </g>
  );
}

function GiantHead({ c }: { c: string }) {
  return (
    <g>
      <rect x="182" y="100" width="36" height="14" fill={JOINT} />
      <path
        d="M176 42l-12-26 22 18M224 42l12-26-22 18"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M200 38V8" stroke={OUTLINE} strokeWidth="5" />
      <circle
        className="hj-gantenna"
        cx="200"
        cy="8"
        r="7"
        fill={GOLD}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <rect
        x="160"
        y="36"
        width="80"
        height="70"
        rx="16"
        fill={c}
        stroke={OUTLINE}
        strokeWidth="6"
      />
      <rect
        x="152"
        y="58"
        width="12"
        height="28"
        rx="4"
        fill={JOINT}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <rect
        x="236"
        y="58"
        width="12"
        height="28"
        rx="4"
        fill={JOINT}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <rect
        x="168"
        y="56"
        width="64"
        height="24"
        rx="8"
        fill={VISOR}
        stroke={GOLD}
        strokeWidth="3"
      />
      <rect className="hj-geye" x="176" y="62" width="18" height="11" rx="3" fill={EYE} />
      <rect className="hj-geye" x="206" y="62" width="18" height="11" rx="3" fill={EYE} />
      <path d="M176 92h48" stroke={SHADE} strokeWidth="6" strokeLinecap="round" />
      <MiniBolt x={200} y={46} />
    </g>
  );
}

// ── Legend signature parts on the giant. ──

function LegendWings() {
  const { color, accent } = LEGEND_LOOK["lg-wing"];
  const half = (
    <g>
      <path
        d="M140 130L-6 -4l18 52-34 4 40 50-30 18 60 28-20 24 110-22z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M130 140L10 30M128 150L-4 104M130 162L20 152" stroke={accent} strokeWidth="7" />
    </g>
  );
  return (
    <g className="hj-glegend" data-glegend="lg-wing">
      {half}
      <g transform={MIRROR}>{half}</g>
    </g>
  );
}

function LegendHalo() {
  const { color } = LEGEND_LOOK["lg-guardian"];
  return (
    <g className="hj-glegend" data-glegend="lg-guardian">
      <g transform="translate(200 28)">
        <g className="hj-ghalo">
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x="-6"
              y="-48"
              width="12"
              height="12"
              rx="2"
              fill={color}
              stroke={GOLD_DARK}
              strokeWidth="2"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <circle r="38" fill="none" stroke={OUTLINE} strokeWidth="12" />
          <circle r="38" fill="none" stroke={color} strokeWidth="8" />
        </g>
      </g>
    </g>
  );
}

function LegendShield() {
  const { color, accent } = LEGEND_LOOK["lg-shield"];
  return (
    <g className="hj-glegend" data-glegend="lg-shield">
      <path
        d="M-14 74h76v118q0 34-38 50q-38-16-38-50z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="6"
      />
      <path
        d="M-4 84h56v106q0 24-28 38q-28-14-28-38z"
        fill={color}
        stroke="#24438a"
        strokeWidth="3"
      />
      <path d="M24 100l10 28h-7v50h-6v-50h-7z" fill={accent} stroke="#24438a" strokeWidth="2.5" />
    </g>
  );
}

function LegendFins() {
  const { color, accent } = LEGEND_LOOK["lg-deep"];
  const half = (
    <g>
      <path
        d="M118 300l-30 10 4 70 26-14z"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="96"
        y="370"
        width="24"
        height="16"
        rx="5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <g className="hj-gbubble" fill="#dff9ff" stroke={accent} strokeWidth="2">
        <circle cx="100" cy="398" r="5" />
        <circle cx="90" cy="410" r="3.5" />
      </g>
    </g>
  );
  return (
    <g className="hj-glegend" data-glegend="lg-deep">
      {half}
      <g transform={MIRROR}>{half}</g>
    </g>
  );
}

function LegendArmor() {
  const { color, accent } = LEGEND_LOOK["lg-steel"];
  const half = (
    <g>
      <path
        d="M116 108h62l-4 24h-28l-6 24h-26z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M120 116h52" stroke={accent} strokeWidth="5" />
      <g fill="#2b3138">
        <circle cx="124" cy="128" r="2.5" />
        <circle cx="140" cy="128" r="2.5" />
        <circle cx="124" cy="146" r="2.5" />
        <circle cx="166" cy="126" r="2.5" />
      </g>
    </g>
  );
  return (
    <g className="hj-glegend" data-glegend="lg-steel">
      {half}
      <g transform={MIRROR}>{half}</g>
      <rect
        x="150"
        y="226"
        width="100"
        height="16"
        rx="4"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path d="M156 234h88" stroke={accent} strokeWidth="4" strokeDasharray="8 6" />
    </g>
  );
}

function LegendCannon({ firing }: { firing: boolean }) {
  const { color, accent } = LEGEND_LOOK["lg-thunder"];
  return (
    <g className="hj-glegend" data-glegend="lg-thunder">
      <rect
        x="332"
        y="150"
        width="40"
        height="120"
        rx="10"
        fill={accent}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      {[170, 192, 214, 236].map((y) => (
        <ellipse
          key={y}
          cx="352"
          cy={y}
          rx="24"
          ry="7"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="3"
        />
      ))}
      <rect
        x="338"
        y="132"
        width="28"
        height="22"
        rx="4"
        fill={JOINT}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path
        className={firing ? "hj-gzap" : undefined}
        d="M352 128l-12-20h10l-6-18 16 22h-10l8 16z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  );
}

function GiantWeapon() {
  return (
    <g className="hj-gweapon">
      <g className="hj-gbeam">
        <circle cx="200" cy="176" r="62" fill="#fffbe0" opacity=".55" />
        <g stroke="#fff27a" strokeWidth="7" strokeLinecap="round">
          <path d="M200 100v-14M200 252v14M124 176h-14M276 176h14M146 122l-10-10M254 122l10-10M146 230l-10 10M254 230l10 10" />
        </g>
      </g>
      <rect
        x="316"
        y="276"
        width="78"
        height="34"
        rx="10"
        fill={JOINT}
        stroke={OUTLINE}
        strokeWidth="5"
      />
      <rect
        x="386"
        y="270"
        width="16"
        height="46"
        rx="5"
        fill={GOLD}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path
        className="hj-gbeam"
        d="M402 280h60v26h-60z"
        fill="#bff6ff"
        stroke="#3fd8ff"
        strokeWidth="4"
      />
      <ellipse className="hj-gbeam" cx="404" cy="293" rx="14" ry="22" fill="#ffffff" opacity=".8" />
    </g>
  );
}

export function GiantFusionArt({
  phase,
  partColors,
  legends,
  weaponOut,
  size = 320,
  label,
}: {
  phase: GiantPhase;
  partColors: string[];
  legends: LegendId[];
  weaponOut: boolean;
  size?: number;
  label: string;
}) {
  const uid = uidOf(useId());
  const coreId = `hjgc-${uid}`;
  const auraId = `hjgx-${uid}`;
  const col = (part: GiantPart) => {
    const i = GIANT_PARTS.indexOf(part);
    return partColors[i] ?? FALLBACK_COLORS[i] ?? "#8a96a3";
  };
  const has = (id: LegendId) => legends.includes(id);
  const parts: Record<GiantPart, JSX.Element> = {
    back: <GiantBack c={col("back")} />,
    legL: <GiantLeg c={col("legL")} />,
    legR: (
      <g transform={MIRROR}>
        <GiantLeg c={col("legR")} />
      </g>
    ),
    waist: <GiantWaist c={col("waist")} />,
    chest: <GiantChest c={col("chest")} coreId={coreId} />,
    armL: <GiantArm c={col("armL")} />,
    armR: (
      <g transform={MIRROR}>
        <GiantArm c={col("armR")} />
      </g>
    ),
    handL: <GiantHand c={col("handL")} />,
    handR: (
      <g transform={MIRROR}>
        <GiantHand c={col("handR")} />
      </g>
    ),
    shoulderL: <GiantShoulder c={col("shoulderL")} />,
    shoulderR: (
      <g transform={MIRROR}>
        <GiantShoulder c={col("shoulderR")} />
      </g>
    ),
    head: <GiantHead c={col("head")} />,
  };
  // Paint order (back to front); the DOM order differs from the data order on purpose.
  const paint: GiantPart[] = [
    "back",
    "legL",
    "legR",
    "waist",
    "chest",
    "armL",
    "armR",
    "handL",
    "handR",
    "shoulderL",
    "shoulderR",
    "head",
  ];
  return (
    <svg
      className={`hj-giant phase-${phase}${weaponOut ? " weapon-out" : ""}`}
      viewBox="-30 -24 500 464"
      width={size}
      height={(size * 464) / 500}
      role="img"
      aria-label={label}
      data-giant-phase={phase}
      data-giant-parts="12"
      data-giant-legends={legends.length}
      data-weapon={weaponOut ? "drawn" : "stowed"}
    >
      <defs>
        <radialGradient id={coreId}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#7ff3ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={auraId}>
          <stop offset="0" stopColor="#fff6b8" stopOpacity=".7" />
          <stop offset=".6" stopColor="#ffe27a" stopOpacity=".25" />
          <stop offset="1" stopColor="#ffe27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="200" rx="230" ry="230" fill={`url(#${auraId})`} />
      <ellipse cx="200" cy="424" rx="150" ry="12" fill="#355e6433" />
      <g className="hj-gbody">
        {has("lg-wing") && <LegendWings />}
        {has("lg-guardian") && <LegendHalo />}
        {paint.map((p) => (
          <GPart key={p} name={p}>
            {parts[p]}
          </GPart>
        ))}
        {has("lg-steel") && <LegendArmor />}
        {has("lg-deep") && <LegendFins />}
        {has("lg-thunder") && <LegendCannon firing={weaponOut} />}
        {has("lg-shield") && <LegendShield />}
        {weaponOut && <GiantWeapon />}
      </g>
      {phase === "assembling" && (
        <circle className="hj-gflash" cx="200" cy="210" r="225" fill="#fffbe0" />
      )}
    </svg>
  );
}

// ── Villain giant from the rusty gear empire. ──

const BOSS_LABEL: Record<BossPhase, string> = {
  idle: "대기 중",
  approach: "다가오는 중",
  telegraph: "힘 모으는 중",
  attack: "내려찍기 공격",
  stagger: "비틀거리는 중",
  retreat: "도망가는 중",
};

function GearShape({ r, teeth, fill }: { r: number; teeth: number; fill: string }) {
  return (
    <g>
      {Array.from({ length: teeth }, (_, i) => (
        <rect
          key={i}
          x={-r * 0.18}
          y={-r * 1.25}
          width={r * 0.36}
          height={r * 0.4}
          rx="1.5"
          fill={fill}
          stroke={OUTLINE}
          strokeWidth="2"
          transform={`rotate(${(360 / teeth) * i})`}
        />
      ))}
      <circle r={r} fill={fill} stroke={OUTLINE} strokeWidth="3" />
      <circle r={r * 0.38} fill={OUTLINE} />
    </g>
  );
}

export function GiantBossArt({
  phase,
  shield,
  size = 300,
}: {
  phase: BossPhase;
  shield: boolean;
  size?: number;
}) {
  const uid = uidOf(useId());
  const hexId = `hjbh-${uid}`;
  const glowId = `hjbg-${uid}`;
  const gray = phase === "retreat";
  const away = phase === "retreat";
  const rust = gray ? "#8d8f94" : "#a8692f";
  const maroon = gray ? "#6a6c71" : "#6e2a2a";
  const dark = gray ? "#4f5156" : "#4a2a1a";
  const brass = gray ? "#a4a6aa" : "#c9923e";
  const lamp = gray ? "#5a5a5a" : "#ff3b30";

  const body =
    phase === "approach"
      ? "rotate(7 200 410)"
      : phase === "stagger"
        ? "rotate(-13 200 410) translate(-10 0)"
        : phase === "attack"
          ? "translate(0 18)"
          : phase === "retreat"
            ? "translate(400 0) scale(-1 1) rotate(-6 200 410) translate(16 0)"
            : undefined;
  const armL =
    phase === "telegraph"
      ? "rotate(150 118 170)"
      : phase === "attack"
        ? "rotate(34 118 170)"
        : phase === "approach"
          ? "rotate(18 118 170)"
          : phase === "stagger"
            ? "rotate(40 118 170)"
            : undefined;
  const armR =
    phase === "telegraph"
      ? "rotate(-150 282 170)"
      : phase === "attack"
        ? "rotate(-34 282 170)"
        : phase === "approach"
          ? "rotate(-8 282 170)"
          : phase === "stagger"
            ? "rotate(-60 282 170)"
            : undefined;
  const legL = phase === "approach" ? "rotate(14 162 300)" : undefined;
  const legR = phase === "approach" ? "rotate(-10 238 300)" : undefined;

  const spikes = (
    <path
      d="M86 150l-26-14 22-6zM96 128l-6-30 20 18zM122 122l14-28 4 26z"
      fill={brass}
      stroke={OUTLINE}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  );

  return (
    <svg
      className={`hj-boss phase-${phase}${shield ? " shielded" : ""}`}
      viewBox="-20 -20 440 450"
      width={size}
      height={(size * 450) / 440}
      role="img"
      aria-label={`거대 악당 로봇 (${BOSS_LABEL[phase]})`}
      data-boss-phase={phase}
      data-boss-shield={shield ? "on" : "off"}
    >
      <defs>
        <pattern id={hexId} width="24" height="41.6" patternUnits="userSpaceOnUse">
          <path
            d="M12 0l12 6.9v13.9L12 27.7 0 20.8V6.9zM0 20.8v20.8M24 20.8v20.8"
            fill="none"
            stroke="#9ff3ff"
            strokeWidth="1.6"
          />
        </pattern>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor="#ff5a3c" stopOpacity=".7" />
          <stop offset="1" stopColor="#ff5a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="414" rx="130" ry="12" fill="#2a1a1033" />
      {phase === "telegraph" && (
        <circle className="hj-boss-charge" cx="200" cy="170" r="200" fill={`url(#${glowId})`} />
      )}
      {phase === "attack" && (
        <g className="hj-boss-shock">
          <ellipse
            cx="200"
            cy="414"
            rx="200"
            ry="22"
            fill="none"
            stroke="#ffb347"
            strokeWidth="8"
          />
          <ellipse
            cx="200"
            cy="414"
            rx="140"
            ry="14"
            fill="none"
            stroke="#ff7a3c"
            strokeWidth="6"
          />
          <path
            d="M40 380l-20-24M80 370l-8-30M320 370l8-30M360 380l20-24"
            stroke="#ffb347"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g fill="#8a6a52" stroke={OUTLINE} strokeWidth="2">
            <path d="M24 396l10-12 10 10z" />
            <path d="M366 394l10-14 10 12z" />
          </g>
        </g>
      )}
      {phase === "approach" && (
        <g fill="#c9b9a6" opacity=".8">
          <circle cx="110" cy="404" r="12" />
          <circle cx="92" cy="398" r="8" />
          <circle cx="292" cy="406" r="10" />
        </g>
      )}
      <g className="hj-boss-body" transform={body}>
        <g transform={legL}>
          <rect
            x="138"
            y="290"
            width="48"
            height="104"
            rx="10"
            fill={rust}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <rect x="138" y="326" width="48" height="12" fill={dark} />
          <path
            d="M126 410l8-20h60l8 20zM126 410l-6 6h20zM196 410l10 6h-20z"
            fill={dark}
            stroke={OUTLINE}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
        <g transform={legR}>
          <rect
            x="214"
            y="290"
            width="48"
            height="104"
            rx="10"
            fill={rust}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <rect x="214" y="326" width="48" height="12" fill={dark} />
          <path
            d="M198 410l8-20h60l8 20zM198 410l-10 6h20zM270 410l10 6h-20z"
            fill={dark}
            stroke={OUTLINE}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
        <rect
          x="140"
          y="276"
          width="120"
          height="30"
          rx="8"
          fill={dark}
          stroke={OUTLINE}
          strokeWidth="5"
        />
        <path
          d="M118 146h164l-20 140H138z"
          fill={maroon}
          stroke={OUTLINE}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path d="M132 160h136l-6 40H138z" fill={rust} stroke={OUTLINE} strokeWidth="3" />
        <path d="M144 250h112M148 266h104" stroke={dark} strokeWidth="5" />
        {away ? (
          <g>
            <rect
              x="170"
              y="174"
              width="60"
              height="64"
              rx="8"
              fill={dark}
              stroke={OUTLINE}
              strokeWidth="4"
            />
            <path d="M180 188h40M180 202h40M180 216h40" stroke={brass} strokeWidth="4" />
          </g>
        ) : (
          <g transform="translate(200 224)">
            <g className="hj-boss-gear">
              <GearShape r={22} teeth={10} fill={brass} />
            </g>
          </g>
        )}
        <g fill={dark}>
          <circle cx="140" cy="172" r="3" />
          <circle cx="260" cy="172" r="3" />
          <circle cx="150" cy="262" r="3" />
          <circle cx="250" cy="262" r="3" />
        </g>
        {/* Head with a gear-tooth crown and a single cyclops lamp in a visor slit. */}
        <g>
          {[166, 182, 198, 214, 230].map((x) => (
            <path
              key={x}
              d={`M${x - 6} 74l6-18 6 18z`}
              fill={brass}
              stroke={OUTLINE}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          ))}
          <rect x="182" y="132" width="36" height="20" fill={dark} />
          <rect
            x="156"
            y="70"
            width="88"
            height="70"
            rx="12"
            fill={rust}
            stroke={OUTLINE}
            strokeWidth="6"
          />
          <rect
            x="156"
            y="70"
            width="88"
            height="14"
            rx="6"
            fill={brass}
            stroke={OUTLINE}
            strokeWidth="4"
          />
          {away ? (
            <g>
              <path
                d="M172 98h56M172 110h56M172 122h56"
                stroke={dark}
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          ) : (
            <g>
              <rect x="164" y="98" width="72" height="18" rx="5" fill="#160d0a" />
              <circle
                className="hj-boss-lamp"
                cx="200"
                cy="107"
                r={phase === "telegraph" ? 12 : 8}
                fill={lamp}
              />
              <circle cx="200" cy="107" r="3.5" fill="#ffd2c8" />
              <path d="M170 128h60" stroke={dark} strokeWidth="5" strokeLinecap="round" />
            </g>
          )}
        </g>
        {/* Drill arm (viewer left). */}
        <g transform={armL}>
          <rect
            x="94"
            y="170"
            width="44"
            height="64"
            rx="10"
            fill={rust}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <rect
            x="98"
            y="226"
            width="40"
            height="34"
            rx="8"
            fill={dark}
            stroke={OUTLINE}
            strokeWidth="4"
          />
          <path
            d="M96 258h44l-22 70z"
            fill={brass}
            stroke={OUTLINE}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M102 274l34 6M108 292l24 6M112 308l14 4" stroke={OUTLINE} strokeWidth="3" />
        </g>
        {/* Claw arm (viewer right). */}
        <g transform={armR}>
          <rect
            x="262"
            y="170"
            width="44"
            height="64"
            rx="10"
            fill={rust}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <rect
            x="262"
            y="226"
            width="44"
            height="30"
            rx="8"
            fill={dark}
            stroke={OUTLINE}
            strokeWidth="4"
          />
          <path
            d="M266 254l-12 40 18-14 6-24zM302 254l12 40-18-14-6-24z"
            fill={brass}
            stroke={OUTLINE}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M284 254v38" stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" />
        </g>
        <circle cx="118" cy="160" r="34" fill={maroon} stroke={OUTLINE} strokeWidth="5" />
        {spikes}
        <circle cx="282" cy="160" r="34" fill={maroon} stroke={OUTLINE} strokeWidth="5" />
        <g transform={MIRROR}>{spikes}</g>
        <circle cx="118" cy="160" r="12" fill={brass} stroke={OUTLINE} strokeWidth="3" />
        <circle cx="282" cy="160" r="12" fill={brass} stroke={OUTLINE} strokeWidth="3" />
      </g>
      {phase === "telegraph" && (
        <g className="hj-boss-spark" fill="#ffd36b" stroke="#ff5a3c" strokeWidth="2">
          <path d="M60 30l6 12 12 2-10 8 2 12-10-6-10 6 2-12-10-8 12-2z" />
          <path d="M340 30l6 12 12 2-10 8 2 12-10-6-10 6 2-12-10-8 12-2z" />
        </g>
      )}
      {phase === "stagger" && (
        <g className="hj-boss-stars" fill="#ffe45c" stroke={OUTLINE} strokeWidth="2.5">
          <path d="M150 34l5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z" />
          <path d="M196 14l5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z" />
          <path d="M242 34l5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z" />
          <path
            d="M300 200l18-10M304 220l22 2M80 240l-20 6"
            stroke="#ffb347"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      )}
      {phase === "retreat" && (
        <g className="hj-boss-smoke" fill="#9aa0a6" opacity=".8">
          <circle cx="210" cy="50" r="18" />
          <circle cx="232" cy="26" r="13" />
          <circle cx="250" cy="6" r="9" />
          <circle cx="150" cy="200" r="12" />
        </g>
      )}
      {shield && (
        <g className="hj-boss-shield">
          <path
            d="M200 -10L390 100v220L200 430 10 320V100z"
            fill={`url(#${hexId})`}
            opacity=".35"
          />
          <path
            d="M200 -10L390 100v220L200 430 10 320V100z"
            fill="#7fe8ff"
            fillOpacity=".16"
            stroke="#7fe8ff"
            strokeWidth="6"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

// ── Minion bots. ──

type MinionPhase = "active" | "hit" | "retreat";
const MINION_LOOKS = [
  { body: "#a8692f", trim: "#6e2a2a" },
  { body: "#8a3b2e", trim: "#c9923e" },
  { body: "#7a6a3a", trim: "#4a3a2a" },
  { body: "#b4743a", trim: "#3e4a52" },
  { body: "#5a4a44", trim: "#c0502e" },
];
const MINION_LABEL: Record<MinionPhase, string> = {
  active: "악당 꼬마 로봇",
  hit: "맞은 악당 꼬마 로봇",
  retreat: "도망가는 악당 꼬마 로봇",
};

export function MinionRobotArt({
  phase,
  size = 64,
  variant = 0,
}: {
  phase: MinionPhase;
  size?: number;
  variant?: number;
}) {
  const v = ((Math.floor(variant) % 5) + 5) % 5;
  const look = MINION_LOOKS[v] ?? { body: "#a8692f", trim: "#6e2a2a" };
  const gray = phase === "retreat";
  const body = gray ? "#9a9ca0" : look.body;
  const trim = gray ? "#6c6e72" : look.trim;
  const pose =
    phase === "hit"
      ? "rotate(-20 50 92) translate(-4 0)"
      : phase === "retreat"
        ? "translate(100 0) scale(-1 1)"
        : undefined;
  const style: CSSProperties | undefined = gray ? { opacity: 0.85 } : undefined;
  return (
    <svg
      className={`hj-minion phase-${phase}`}
      viewBox="-6 -8 112 110"
      width={size}
      height={(size * 110) / 112}
      role="img"
      aria-label={MINION_LABEL[phase]}
      data-minion-phase={phase}
      data-minion-variant={v}
      style={style}
    >
      <ellipse cx="50" cy="96" rx="24" ry="4" fill="#2a1a1033" />
      <g className="hj-minion-body" transform={pose}>
        {v === 0 && (
          <g transform="translate(50 6)">
            <path d="M0 10V2" stroke={OUTLINE} strokeWidth="3" />
            <GearShape r={6} teeth={6} fill={trim} />
          </g>
        )}
        {v === 1 && (
          <path
            d="M34 22l-6-16 14 10zM66 22l6-16-14 10z"
            fill={trim}
            stroke={OUTLINE}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        {v === 2 && (
          <g>
            <path d="M50 18V8" stroke={OUTLINE} strokeWidth="3" />
            <ellipse
              className="hj-minion-prop"
              cx="50"
              cy="7"
              rx="16"
              ry="3.5"
              fill={trim}
              stroke={OUTLINE}
              strokeWidth="2"
            />
          </g>
        )}
        {v === 4 && (
          <g transform="translate(50 14)">
            <GearShape r={10} teeth={8} fill={trim} />
          </g>
        )}
        <rect
          x="38"
          y="74"
          width="9"
          height="14"
          rx="3"
          fill={trim}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />
        <rect
          x="53"
          y="74"
          width="9"
          height="14"
          rx="3"
          fill={trim}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />
        <path d="M32 92l4-6h14v6zM50 92v-6h14l4 6z" fill={OUTLINE} />
        <rect
          x="18"
          y="50"
          width="10"
          height="20"
          rx="4"
          fill={body}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />
        <path
          d="M16 70l6 8 6-8"
          fill="none"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="72"
          y="50"
          width="10"
          height="20"
          rx="4"
          fill={body}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />
        {v === 3 ? (
          <path
            d="M70 70h14l-7 18z"
            fill={trim}
            stroke={OUTLINE}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M72 70l6 8 6-8"
            fill="none"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        <rect
          x="26"
          y="46"
          width="48"
          height="32"
          rx="9"
          fill={body}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
        <circle cx="50" cy="62" r="7" fill={trim} stroke={OUTLINE} strokeWidth="2" />
        <circle cx="50" cy="62" r="2.5" fill={OUTLINE} />
        <rect
          x="30"
          y="18"
          width="40"
          height="30"
          rx="10"
          fill={body}
          stroke={OUTLINE}
          strokeWidth="3.5"
        />
        {gray ? (
          <path d="M36 32h28M36 39h28" stroke={trim} strokeWidth="3" strokeLinecap="round" />
        ) : (
          <g>
            <rect x="35" y="27" width="30" height="10" rx="4" fill="#160d0a" />
            <circle className="hj-minion-lamp" cx="50" cy="32" r="4" fill="#ff3b30" />
            <rect x="38" y="40" width="24" height="3" rx="1.5" fill={trim} />
          </g>
        )}
      </g>
      {phase === "hit" && (
        <g className="hj-minion-hit">
          <circle cx="50" cy="54" r="40" fill="#ffffff" opacity=".45" />
          <path
            d="M84 20l4 9 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1z"
            fill="#ffe45c"
            stroke={OUTLINE}
            strokeWidth="2"
          />
          <path
            d="M10 30l8 6M6 48l10 0M88 60l10 4"
            stroke="#ffb347"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}
      {phase === "retreat" && (
        <g className="hj-minion-smoke" fill="#9aa0a6" opacity=".8">
          <circle cx="62" cy="10" r="8" />
          <circle cx="72" cy="0" r="5.5" />
        </g>
      )}
    </svg>
  );
}
