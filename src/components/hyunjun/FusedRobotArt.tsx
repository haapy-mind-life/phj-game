import { useId } from "react";
import type { RobotSpecies } from "@/game/robot-catalog";
import "./robot-fusion.css";

// One combined fusion robot: a single skeleton where each body part comes from a team member and
// keeps that member's family look and color. Visor and lamp eyes only, never a human face.
// Base frame: body centred on x=100, feet on y=200. 3단 is the same skeleton scaled ×1.25.

export type FusionPhase = "assembling" | "fused" | "splitting";

const OUTLINE = "#2f3a44";
const JOINT = "#3d4650";
const GOLD = "#f5c542";
const GOLD_DARK = "#8a6a12";
const SILVER = "#d9dfe5";
const SILVER_DARK = "#7d8790";
const EYE = "#7ff3ff";
const MIRROR = "translate(200 0) scale(-1 1)";

function Rivets({ points }: { points: [number, number][] }) {
  return (
    <g fill={SILVER_DARK}>
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
      ))}
    </g>
  );
}

function Head({ m, grade }: { m: RobotSpecies; grade: number }) {
  return (
    <g>
      {grade >= 1 && (
        <g fill={GOLD} stroke={GOLD_DARK} strokeWidth="2">
          <rect x="71" y="50" width="9" height="20" rx="3" />
          <rect x="120" y="50" width="9" height="20" rx="3" />
        </g>
      )}
      <rect x="92" y="76" width="16" height="10" fill={JOINT} />
      <rect
        x="78"
        y="44"
        width="44"
        height="36"
        rx="9"
        fill={m.color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect
        x="83"
        y="53"
        width="34"
        height="15"
        rx="5"
        fill="#1f2a33"
        stroke={grade >= 1 ? GOLD : "none"}
        strokeWidth="2"
      />
      <rect className="hj-feye" x="87" y="57.5" width="10" height="6" rx="2" fill={EYE} />
      <rect className="hj-feye" x="103" y="57.5" width="10" height="6" rx="2" fill={EYE} />
      {grade >= 2 && (
        <g>
          <rect
            x="81"
            y="70"
            width="14"
            height="7"
            rx="2"
            fill={SILVER}
            stroke={SILVER_DARK}
            strokeWidth="1.5"
          />
          <rect
            x="105"
            y="70"
            width="14"
            height="7"
            rx="2"
            fill={SILVER}
            stroke={SILVER_DARK}
            strokeWidth="1.5"
          />
          <Rivets
            points={[
              [84, 73.5],
              [92, 73.5],
              [108, 73.5],
              [116, 73.5],
            ]}
          />
        </g>
      )}
      {m.family === "police" && (
        <g>
          <rect x="88" y="33" width="24" height="12" rx="4" fill={OUTLINE} />
          <rect
            className="hj-fsiren red"
            x="90"
            y="35"
            width="9"
            height="8"
            rx="2"
            fill="#ff5d5d"
          />
          <rect
            className="hj-fsiren blue"
            x="101"
            y="35"
            width="9"
            height="8"
            rx="2"
            fill="#5d9bff"
          />
        </g>
      )}
      {m.family === "fire" && (
        <g>
          <path d="M80 46h40l-5-13H85z" fill="#ffd36b" stroke={OUTLINE} strokeWidth="3" />
          <rect x="96" y="35" width="8" height="8" rx="2" fill="#e05a4f" />
        </g>
      )}
      {m.family === "sky" && (
        <path d="M100 24l9 20H91z" fill={m.accent} stroke={OUTLINE} strokeWidth="3" />
      )}
      {grade >= 1 && m.family !== "police" && (
        <path d="M94 44l6-9 6 9z" fill={GOLD} stroke={GOLD_DARK} strokeWidth="2" />
      )}
    </g>
  );
}

function Torso({ m, grade, glowId }: { m: RobotSpecies; grade: number; glowId: string }) {
  return (
    <g>
      <rect
        x="70"
        y="84"
        width="60"
        height="56"
        rx="12"
        fill={m.color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <rect x="80" y="92" width="40" height="26" rx="6" fill={m.accent} />
      {m.family === "police" && (
        <path
          d="M100 94l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"
          fill="#f7c948"
          stroke={OUTLINE}
          strokeWidth="2"
        />
      )}
      {m.family === "fire" && (
        <g>
          <circle cx="100" cy="105" r="9" fill="#e05a4f" stroke={OUTLINE} strokeWidth="2" />
          <path d="M100 99q5 6 0 11q-5-5 0-11z" fill="#9ee3ff" />
        </g>
      )}
      {m.family === "sky" && (
        <path d="M86 112l14-12 14 12" fill="none" stroke={m.color} strokeWidth="5" />
      )}
      {m.mark === "bolt" && <path d="M86 96l5-4-1 4h3l-5 6 1-5z" fill="#ffe45c" />}
      {m.mark === "lava" && (
        <path d="M74 132l8-6 6 5 8-8 8 7 8-6 8 8" fill="none" stroke="#ffb347" strokeWidth="3" />
      )}
      {m.mark === "laser" && <rect x="112" y="96" width="6" height="6" rx="2" fill="#9ef3ff" />}
      <circle cx="100" cy="127" r="9" fill={`url(#${glowId})`} />
      <circle
        className="hj-fcore"
        cx="100"
        cy="127"
        r="5"
        fill="#c9fbff"
        stroke={OUTLINE}
        strokeWidth="2"
      />
      <rect x="74" y="134" width="52" height="9" rx="3" fill={JOINT} />
      {grade >= 1 && (
        <rect
          x="78"
          y="82"
          width="44"
          height="7"
          rx="3"
          fill={GOLD}
          stroke={GOLD_DARK}
          strokeWidth="2"
        />
      )}
      {grade >= 2 && (
        <g>
          <rect
            x="72"
            y="94"
            width="9"
            height="32"
            rx="2"
            fill={SILVER}
            stroke={SILVER_DARK}
            strokeWidth="1.5"
          />
          <rect
            x="119"
            y="94"
            width="9"
            height="32"
            rx="2"
            fill={SILVER}
            stroke={SILVER_DARK}
            strokeWidth="1.5"
          />
          <Rivets
            points={[
              [76.5, 98],
              [76.5, 122],
              [123.5, 98],
              [123.5, 122],
            ]}
          />
        </g>
      )}
    </g>
  );
}

/** Left arm in base coordinates; the right arm is the same drawing mirrored. */
function Arm({ m, grade, side }: { m: RobotSpecies; grade: number; side: "l" | "r" }) {
  const { color, accent, family } = m;
  return (
    <g>
      <rect
        x="54"
        y="90"
        width="16"
        height="28"
        rx="6"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      {family === "police" && (
        <g>
          <rect
            x="44"
            y="112"
            width="24"
            height="38"
            rx="7"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          {side === "l" ? (
            <g>
              <path
                d="M24 110h24v26q0 14-12 21q-12-7-12-21z"
                fill={accent}
                stroke={color}
                strokeWidth="4"
              />
              <path
                d="M36 120l2.6 5 5.4.6-4 3.8 1 5.4-5-2.6-5 2.6 1-5.4-4-3.8 5.4-.6z"
                fill="#f7c948"
                stroke={OUTLINE}
                strokeWidth="1.5"
              />
            </g>
          ) : (
            <path d="M44 118l-10 4v20l10 4z" fill={accent} stroke={OUTLINE} strokeWidth="2.5" />
          )}
          <rect x="47" y="116" width="18" height="5" rx="2" fill="#5d9bff" />
          <circle cx="56" cy="155" r="7" fill={JOINT} />
        </g>
      )}
      {family === "fire" && (
        <g>
          <rect
            x="40"
            y="112"
            width="30"
            height="36"
            rx="9"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <path d="M40 122h30M40 136h30" stroke="#ffd36b" strokeWidth="4" />
          <rect x="45" y="146" width="20" height="11" rx="2" fill={JOINT} />
          <rect x="43" y="155" width="24" height="5" rx="2" fill="#a9b4bf" stroke={OUTLINE} />
          <circle cx="55" cy="161" r="3" fill="#9ee3ff" />
        </g>
      )}
      {family === "sky" && (
        <g>
          <path
            d="M48 116L14 102L22 126L12 140L46 148z"
            fill={accent}
            stroke={color}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M44 124L22 116M44 136L24 136" stroke={color} strokeWidth="2.5" />
          <rect
            x="46"
            y="112"
            width="20"
            height="38"
            rx="6"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <circle cx="56" cy="155" r="7" fill={JOINT} />
        </g>
      )}
      <circle cx="64" cy="94" r="8" fill={JOINT} stroke={OUTLINE} strokeWidth="2" />
      {grade >= 1 && (
        <rect
          x="46"
          y="84"
          width="28"
          height="12"
          rx="5"
          fill={GOLD}
          stroke={GOLD_DARK}
          strokeWidth="2"
        />
      )}
      {grade >= 2 && (
        <g>
          <rect
            x="48"
            y="124"
            width="16"
            height="14"
            rx="2"
            fill={SILVER}
            stroke={SILVER_DARK}
            strokeWidth="1.5"
          />
          <Rivets
            points={[
              [51, 127],
              [61, 127],
              [51, 135],
              [61, 135],
            ]}
          />
        </g>
      )}
    </g>
  );
}

/** Left leg in base coordinates. */
function Leg({ m, grade }: { m: RobotSpecies; grade: number }) {
  const { color, accent, family } = m;
  return (
    <g>
      <rect
        x="77"
        y="140"
        width="18"
        height="28"
        rx="5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <circle cx="86" cy="168" r="5" fill={JOINT} />
      {family === "police" && (
        <g>
          <rect
            x="74"
            y="168"
            width="24"
            height="24"
            rx="5"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <rect x="78" y="173" width="16" height="5" rx="2" fill={accent} />
          <rect x="70" y="189" width="30" height="10" rx="3" fill={JOINT} />
          <circle className="hj-fsiren red" cx="77" cy="194" r="2.6" fill="#ff5d5d" />
          <circle className="hj-fsiren blue" cx="93" cy="194" r="2.6" fill="#5d9bff" />
        </g>
      )}
      {family === "fire" && (
        <g>
          <rect
            x="72"
            y="166"
            width="28"
            height="24"
            rx="5"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="3"
          />
          <g stroke="#a5682d" strokeWidth="2.5" fill="none">
            <path d="M70 142v46M76 142v46" />
            <path d="M70 150h6M70 160h6M70 170h6M70 180h6" />
          </g>
          <path d="M70 142v46M76 142v46" stroke="#ffd36b" strokeWidth="1.5" />
          <rect x="66" y="186" width="38" height="13" rx="6" fill={JOINT} />
          <g fill="#8d98a3">
            <circle cx="73" cy="192.5" r="3.5" />
            <circle cx="85" cy="192.5" r="3.5" />
            <circle cx="97" cy="192.5" r="3.5" />
          </g>
        </g>
      )}
      {family === "sky" && (
        <g>
          <path
            d="M74 168h24l-3 22H77z"
            fill={color}
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M78 176h16" stroke={accent} strokeWidth="3" />
          <path d="M77 190h18l3 7H74z" fill="#8d98a3" stroke={OUTLINE} strokeWidth="2" />
          <path className="hj-fjet" d="M78 198h16l-8 9z" fill="#ffb347" />
          <path className="hj-fjet" d="M82 198h8l-4 5z" fill="#fff3a0" />
        </g>
      )}
      {grade >= 1 && (
        <rect
          x="79"
          y="162"
          width="14"
          height="11"
          rx="4"
          fill={GOLD}
          stroke={GOLD_DARK}
          strokeWidth="2"
        />
      )}
      {grade >= 2 && (
        <g>
          <rect
            x="79"
            y="144"
            width="14"
            height="15"
            rx="2"
            fill={SILVER}
            stroke={SILVER_DARK}
            strokeWidth="1.5"
          />
          <Rivets
            points={[
              [82, 147],
              [90, 147],
              [82, 156],
              [90, 156],
            ]}
          />
        </g>
      )}
    </g>
  );
}

/** 2단 backpack from the arms member, peeking out above the shoulders (left half; mirrored). */
function BackpackHalf({ m }: { m: RobotSpecies }) {
  const { color, accent, family } = m;
  if (family === "police") {
    return (
      <g>
        <rect
          x="68"
          y="66"
          width="18"
          height="36"
          rx="5"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="3"
        />
        <rect x="70" y="58" width="12" height="10" rx="3" fill={OUTLINE} />
        <rect className="hj-fsiren red" x="72" y="60" width="8" height="6" rx="2" fill="#ff5d5d" />
      </g>
    );
  }
  if (family === "fire") {
    return (
      <g>
        <rect
          x="66"
          y="60"
          width="16"
          height="44"
          rx="8"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="3"
        />
        <rect
          x="70"
          y="54"
          width="8"
          height="8"
          rx="2"
          fill="#a9b4bf"
          stroke={OUTLINE}
          strokeWidth="2"
        />
        <path d="M66 74h16" stroke="#ffd36b" strokeWidth="3" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M84 86L58 52L66 76L56 82z"
        fill={accent}
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="70"
        y="70"
        width="16"
        height="30"
        rx="5"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="3"
      />
    </g>
  );
}

/** 3단 big back wings / thrusters from the legs member (left half; mirrored). */
function WingHalf({ m }: { m: RobotSpecies }) {
  const { color, accent, family } = m;
  if (family === "sky") {
    return (
      <g>
        <path
          d="M82 96L6 50L16 76L0 88L18 104L8 120L78 126z"
          fill={accent}
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M76 104L18 72M76 112L14 96M76 120L22 116" stroke={color} strokeWidth="3" />
      </g>
    );
  }
  if (family === "police") {
    return (
      <g>
        <path
          d="M82 94L10 60L22 92L14 118L80 128z"
          fill={color}
          stroke={OUTLINE}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M76 100L20 72M74 116L22 108" stroke={accent} strokeWidth="4" />
        <circle className="hj-fsiren red" cx="14" cy="64" r="5" fill="#ff5d5d" />
        <circle className="hj-fsiren blue" cx="18" cy="114" r="5" fill="#5d9bff" />
      </g>
    );
  }
  return (
    <g transform="rotate(-18 66 96)">
      <rect
        x="54"
        y="52"
        width="22"
        height="66"
        rx="10"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="4"
      />
      <path d="M54 68h22M54 98h22" stroke="#ffd36b" strokeWidth="4" />
      <path d="M57 118h16l3 9H54z" fill="#8d98a3" stroke={OUTLINE} strokeWidth="2" />
      <path className="hj-fjet" d="M56 127h20l-10 16z" fill="#ffb347" />
      <path className="hj-fjet" d="M61 127h10l-5 8z" fill="#fff3a0" />
    </g>
  );
}

/** Weapon at the right hand (hand ≈ 144,155 in base coordinates). */
function Weapon({ m, out }: { m: RobotSpecies; out: boolean }) {
  if (m.family === "police") {
    return out ? (
      <g className="hj-fweapon drawn">
        <g transform="rotate(38 144 156)">
          <rect x="136" y="56" width="16" height="96" rx="8" fill="#7ff3ff" opacity=".35" />
          <rect
            x="139.5"
            y="60"
            width="9"
            height="90"
            rx="4.5"
            fill="#e6feff"
            stroke="#3fd8ff"
            strokeWidth="2"
          />
          <rect
            x="132"
            y="148"
            width="24"
            height="6"
            rx="2"
            fill={GOLD}
            stroke={GOLD_DARK}
            strokeWidth="1.5"
          />
          <rect x="140" y="153" width="8" height="12" rx="2" fill={JOINT} />
        </g>
      </g>
    ) : (
      <g className="hj-fweapon stowed">
        <rect
          x="153"
          y="116"
          width="6"
          height="28"
          rx="3"
          fill="#bfeff7"
          stroke={OUTLINE}
          strokeWidth="1.5"
        />
      </g>
    );
  }
  if (m.family === "fire") {
    return out ? (
      <g className="hj-fweapon drawn">
        <g transform="rotate(-68 145 156)">
          <rect
            x="138"
            y="154"
            width="14"
            height="30"
            rx="3"
            fill="#a9b4bf"
            stroke={OUTLINE}
            strokeWidth="2.5"
          />
          <rect x="136" y="180" width="18" height="7" rx="2" fill={JOINT} />
          <g className="hj-fspray" fill="#8fd8ff" stroke="#3a9bd8" strokeWidth="1.5">
            <path d="M139 188q6 6 12 0l14 30q-20 10-40 0z" fill="#bfeaff" />
            <circle cx="132" cy="222" r="4" />
            <circle cx="145" cy="228" r="5" />
            <circle cx="158" cy="222" r="4" />
            <circle cx="126" cy="210" r="3" />
            <circle cx="164" cy="210" r="3" />
          </g>
        </g>
      </g>
    ) : (
      <g className="hj-fweapon stowed">
        <rect
          x="150"
          y="160"
          width="10"
          height="5"
          rx="2"
          fill="#a9b4bf"
          stroke={OUTLINE}
          strokeWidth="1.5"
        />
      </g>
    );
  }
  const blade = "M0-4C10-22 26-22 30-16C18-14 10-8 4 2z";
  return out ? (
    <g className="hj-fweapon drawn">
      <g transform="translate(168 120)">
        <circle
          r="26"
          fill="none"
          stroke="#bff6ec"
          strokeWidth="3"
          strokeDasharray="10 8"
          opacity=".8"
        />
        <g className="hj-fboom">
          {[0, 120, 240].map((a) => (
            <path
              key={a}
              d={blade}
              transform={`rotate(${a})`}
              fill={m.accent}
              stroke={m.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}
          <circle r="5" fill={m.color} stroke={OUTLINE} strokeWidth="2" />
        </g>
      </g>
    </g>
  ) : (
    <g className="hj-fweapon stowed">
      <path
        d="M152 120l8 10-8 10"
        fill="none"
        stroke={m.accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}

export function FusedRobotArt({
  team,
  grades,
  weaponOut,
  moving = false,
  size = 120,
  label,
  phase,
}: {
  team: RobotSpecies[];
  grades: number[];
  weaponOut: boolean;
  moving?: boolean;
  size?: number;
  label: string;
  phase: FusionPhase;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const core = team[0];
  if (!core) return <svg role="img" aria-label={label} width={size} height={size} />;
  const stage = team.length >= 3 ? 3 : 2;
  const armsM = team[1] ?? core;
  const legsM = stage === 3 ? (team[2] ?? core) : core;
  const g0 = grades[0] ?? 0;
  const g1 = grades[1] ?? 0;
  const legGrade = stage === 3 ? (grades[2] ?? 0) : g0;
  const glowId = `hjfg-${uid}`;
  const auraId = `hjfa-${uid}`;
  const scale = stage === 3 ? "translate(100 200) scale(1.25) translate(-100 -200)" : undefined;

  return (
    <svg
      className={`hj-fused stage-${stage} phase-${phase}${moving ? " moving" : ""}`}
      viewBox="-30 -40 260 250"
      width={size}
      height={(size * 250) / 260}
      role="img"
      aria-label={label}
      data-fusion={team.length}
      data-fusion-phase={phase}
      data-part-head={core.id}
      data-part-torso={core.id}
      data-part-arms={armsM.id}
      data-part-legs={legsM.id}
      data-weapon={weaponOut ? "drawn" : "stowed"}
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#7ff3ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={auraId}>
          <stop offset="0" stopColor="#fff6b8" stopOpacity=".9" />
          <stop offset=".55" stopColor="#ffe27a" stopOpacity=".55" />
          <stop offset="1" stopColor={legsM.color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="203" rx={stage === 3 ? 62 : 44} ry="6" fill="#355e6426" />
      {stage === 3 && (
        <ellipse
          className="hj-faura"
          cx="100"
          cy="100"
          rx="128"
          ry="128"
          fill={`url(#${auraId})`}
        />
      )}
      <g transform={scale}>
        <g className="hj-fbody">
          {stage === 3 && (
            <g className="hj-fpart hj-fpart-wings">
              <WingHalf m={legsM} />
              <g transform={MIRROR}>
                <WingHalf m={legsM} />
              </g>
            </g>
          )}
          {stage === 2 && (
            <g className="hj-fpart hj-fpart-backpack">
              <BackpackHalf m={armsM} />
              <g transform={MIRROR}>
                <BackpackHalf m={armsM} />
              </g>
            </g>
          )}
          <g className="hj-fpart hj-fpart-legs">
            <g className="hj-fleg hj-fleg-l">
              <Leg m={legsM} grade={legGrade} />
            </g>
            <g className="hj-fleg hj-fleg-r">
              <g transform={MIRROR}>
                <Leg m={legsM} grade={legGrade} />
              </g>
            </g>
          </g>
          <g className="hj-fpart hj-fpart-torso">
            <Torso m={core} grade={g0} glowId={glowId} />
          </g>
          <g className="hj-fpart hj-fpart-head">
            <Head m={core} grade={g0} />
          </g>
          <g className="hj-fpart hj-fpart-arms">
            <g className="hj-farm hj-farm-l">
              <Arm m={armsM} grade={g1} side="l" />
            </g>
            <g className="hj-farm hj-farm-r">
              <g transform={MIRROR}>
                <Arm m={armsM} grade={g1} side="r" />
              </g>
              <Weapon m={armsM} out={weaponOut} />
            </g>
          </g>
        </g>
      </g>
      {phase === "assembling" && (
        <circle className="hj-fflash" cx="100" cy="120" r="110" fill="#fffbe0" />
      )}
    </svg>
  );
}
