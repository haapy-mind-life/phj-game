import { FriendArt } from "./FriendArt";
import { RobotArt } from "./RobotArt";
import { YARD } from "@/lib/world-model";
import {
  AIRPORT,
  COAST,
  HOUSE_TIERS,
  OCEAN,
  OCEAN_DISCOVERIES,
  RUNWAY,
} from "@/game/unified-world";
export function UnifiedCoast({
  seconds = 0,
  parkedPlane,
  submarine,
  submerged,
  discovered,
  robotFollowing,
}: {
  seconds?: number;
  parkedPlane: boolean;
  submarine: boolean;
  submerged: boolean;
  discovered: string[];
  robotFollowing: boolean;
}) {
  return (
    <svg
      className="hj-unified-coast"
      width="10200"
      height="1800"
      viewBox="0 0 10200 1800"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="unified-sea" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#8fe3ec" />
          <stop offset=".55" stopColor="#2996c7" />
          <stop offset="1" stopColor="#0f4a76" />
        </linearGradient>
        <linearGradient
          id="coast-land"
          gradientUnits="userSpaceOnUse"
          x1="5600"
          y1="0"
          x2="7330"
          y2="0"
        >
          <stop stopColor="#d7e7b9" />
          <stop offset=".45" stopColor="#e9e6b6" />
          <stop offset=".8" stopColor="#f6e3a6" />
          <stop offset="1" stopColor="#f2d78f" />
        </linearGradient>
        <linearGradient
          id="shallow-water"
          gradientUnits="userSpaceOnUse"
          x1="7370"
          y1="0"
          x2="7700"
          y2="0"
        >
          <stop stopColor="#c8f6ef" />
          <stop offset="1" stopColor="#c8f6ef" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="5600" width="1780" height="1800" fill="url(#coast-land)" />
      <path
        d="M5600 850H6960M6200 850V1500M6750 850V450"
        fill="none"
        stroke="#f5e7ca"
        strokeWidth="100"
      />
      <path d="M7230 0Q7310 250 7240 480T7250 960T7270 1450T7260 1800H7390V0Z" fill="#f4dc9a" />
      <rect
        x={OCEAN.start}
        y="0"
        width={10200 - OCEAN.start}
        height="1800"
        fill="url(#unified-sea)"
      />
      <rect x={OCEAN.start} y="0" width="330" height="1800" fill="url(#shallow-water)" />
      <path
        d="M7384 0Q7350 250 7390 480T7384 960T7396 1450T7384 1800"
        fill="none"
        stroke="#ffffff"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="70 36"
        opacity=".85"
      />
      <path
        d="M7440 0Q7410 250 7450 480T7444 960T7456 1450T7444 1800"
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeDasharray="40 60"
        opacity=".55"
      />
      {[160, 330, 520, 700, 1180, 1330, 1560, 1700].map((y, i) => (
        <text key={y} x={6900 + (i % 3) * 120 + (i % 2) * 40} y={y} fontSize="120">
          {i % 3 === 0 ? "🌴" : i % 3 === 1 ? "⛱️" : "🐚"}
        </text>
      ))}
      {submerged && (
        <rect
          x={OCEAN.start}
          width={10200 - OCEAN.start}
          height="1800"
          fill="#0b4d88"
          opacity=".48"
        />
      )}
      {Array.from({ length: 34 }, (_, i) => (
        <path
          key={i}
          d={`M${7500 + i * 85} ${140 + (i % 6) * 280}q35-12 70 0`}
          stroke="#edffff7d"
          fill="none"
          strokeWidth="6"
        />
      ))}
      <g transform={`translate(${COAST.truck.x} ${COAST.truck.y})`}>
        <rect
          x="-165"
          y="-148"
          width="340"
          height="175"
          rx="27"
          fill="#ffc46e"
          stroke="#fff9dd"
          strokeWidth="11"
        />
        <path d="M-190-148H190L140-204H-145Z" fill="#e9887e" />
        <rect x="-109" y="-97" width="220" height="82" rx="15" fill="#fff3c7" />
        <text y="-42" textAnchor="middle" fontSize="47">
          🍕 🥤 🍛
        </text>
        <circle cx="-101" cy="43" r="33" fill="#535267" />
        <circle cx="115" cy="43" r="33" fill="#535267" />
        <text y="-237" textAnchor="middle" fontSize="37" fill="#526b55" fontWeight="bold">
          현준이 푸드트럭
        </text>
      </g>
      <g transform={`translate(${COAST.truck.x - 48} ${COAST.truck.y - 195})`}>
        <FriendArt index={4} moving={Math.floor(seconds) % 6 < 2} />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g
          key={i}
          transform={`translate(${COAST.customer.x + Math.sin(seconds * 0.3 + i * 1.4) * 210 - 45} ${COAST.customer.y + (i % 3) * 110 + Math.cos(seconds * 0.3 + i) * 45 - 110})`}
        >
          <FriendArt index={i} moving />
          <text y="132" x="42" fontSize="18" fill="#655c41" textAnchor="middle">
            {i < 3 ? "산책 중" : "배고픈 손님"}
          </text>
        </g>
      ))}
      {!robotFollowing && (
        <g transform={`translate(${COAST.robot.x} ${COAST.robot.y}) scale(.62)`}>
          <g transform="translate(-75 -210) scale(1.5)">
            <RobotArt />
          </g>
          <text y="-190" textAnchor="middle" fontSize="28">
            🤖 아빠 로봇
          </text>
        </g>
      )}
      <rect
        x="7240"
        y={COAST.harbor.y + 20}
        width="330"
        height="46"
        rx="8"
        fill="#a97f5b"
        stroke="#7b5a40"
        strokeWidth="6"
      />
      <g>
        <rect
          x={RUNWAY.x1}
          y={RUNWAY.y - RUNWAY.half}
          width={RUNWAY.x2 - RUNWAY.x1}
          height={RUNWAY.half * 2}
          rx="14"
          fill="#6b6f7a"
          stroke="#f3f0e2"
          strokeWidth="8"
        />
        <path
          d={`M${RUNWAY.x1 + 40} ${RUNWAY.y}H${RUNWAY.x2 - 40}`}
          stroke="#fff"
          strokeWidth="8"
          strokeDasharray="60 44"
        />
        <text
          x={(RUNWAY.x1 + RUNWAY.x2) / 2}
          y={RUNWAY.y - 86}
          fontSize="38"
          textAnchor="middle"
          fill="#4f6670"
          fontWeight="bold"
        >
          ✈️ 현준이 비행장
        </text>
        {parkedPlane && (
          <g transform={`translate(${AIRPORT.x} ${AIRPORT.y})`}>
            <PlaneArt />
          </g>
        )}
      </g>
      <g transform={`translate(${COAST.harbor.x} ${COAST.harbor.y})`}>
        <rect x="-150" y="-24" width="310" height="58" rx="17" fill="#ac8164" />
        <ellipse
          cx="10"
          cy="-74"
          rx="130"
          ry="63"
          fill="#ffd96d"
          stroke="#fff4b0"
          strokeWidth="10"
        />
        <circle cx="-38" cy="-88" r="30" fill="#a5e7ec" />
        <circle cx="42" cy="-88" r="30" fill="#a5e7ec" />
        <path d="M0-125V-180H75" fill="none" stroke="#f7c66d" strokeWidth="19" />
        <text y="-205" textAnchor="middle" fontSize="37" fill="#45677e">
          잠수함 항구
        </text>
      </g>
      {submerged && (
        <g>
          {Array.from({ length: 42 }, (_, i) => (
            <circle
              key={i}
              cx={7530 + ((i * 187) % 2590)}
              cy={160 + ((i * 311) % 1490)}
              r={9 + (i % 4) * 5}
              fill="none"
              stroke="#eeffffba"
              strokeWidth="4"
            />
          ))}
          <text x="8130" y="355" fontSize="120">
            🐠 🐟 🐡
          </text>
          <text x="9040" y="1330" fontSize="145">
            🐙 🐢 🪸
          </text>
        </g>
      )}
      {!submerged && (
        <g>
          <text x="8250" y="270" fontSize="54" fill="#eaffff">
            🌊 넓은 바다 · 잠수함으로 탐험해 봐!
          </text>
          <text x="8720" y="490" fontSize="100">
            🐬 🐳
          </text>
        </g>
      )}
      {OCEAN_DISCOVERIES.map((d) => (
        <g key={d.id} transform={`translate(${d.x} ${d.y})`}>
          <ellipse
            rx="95"
            ry="88"
            fill="#ffe7ac77"
            stroke="#f7ffff"
            strokeWidth="7"
            strokeDasharray="16 10"
          />
          <text y="20" fontSize="71" textAnchor="middle">
            {discovered.includes(d.id) ? "✅" : "🐚"}
          </text>
          <text y="-120" fill="#fff9df" fontSize="37" fontWeight="bold" textAnchor="middle">
            {d.name}
          </text>
        </g>
      ))}
      {Array.from({ length: 26 }, (_, i) => (
        <g
          key={i}
          opacity={submerged ? 1 : 0.4}
          transform={`translate(${7500 + i * 94} ${1520 - (i % 4) * 56}) scale(.6)`}
        >
          <path
            d="M0 88q-65-115-22-165M0 88q62-90 25-150M0 88V-66"
            fill="none"
            stroke={i % 2 ? "#efa4ad" : "#8fdcb8"}
            strokeWidth="17"
            strokeLinecap="round"
          />
        </g>
      ))}
      <text x="8490" y="350" fontSize="105">
        🐟 🐙 🐠 🐬
      </text>
      <text x="8300" y="470" fontSize="43" fill="#edffff">
        바닷속 탐험 구역
      </text>
      <text x="5900" y="420" fontSize="44" fill="#6b7f4f" fontWeight="bold">
        🏖️ 바닷가 마을
      </text>
      {submarine && (
        <text x="8060" y="150" fontSize="40" fill="white">
          잠수함 탐험 중
        </text>
      )}
    </svg>
  );
}
export function GrowingHome({ tier }: { tier: number }) {
  const level = HOUSE_TIERS[Math.min(4, Math.max(1, tier)) - 1]!;
  const floors = tier > 1 ? 2 : 1;
  return (
    <svg
      className="hj-growing-home"
      width={tier >= 3 ? 570 : tier >= 2 ? 450 : 350}
      height={tier >= 3 ? 415 : 350}
      viewBox="0 0 570 430"
      aria-hidden="true"
    >
      <ellipse cx="285" cy="401" rx="245" ry="28" fill="#627b5930" />
      <rect
        x="70"
        y={floors === 2 ? 126 : 207}
        width="435"
        height={floors === 2 ? 255 : 175}
        rx="23"
        fill={tier >= 3 ? "#fff3d9" : "#fce5d8"}
        stroke="#d8b9ac"
        strokeWidth="11"
      />
      <path
        d={floors === 2 ? "M35 132L285 20L535 132Z" : "M35 213L285 95L535 213Z"}
        fill={tier >= 3 ? "#b598dc" : "#e8a7a6"}
        stroke="#fff1df"
        strokeWidth="10"
      />
      {[135, 250, 370, 465].map((x) => (
        <rect
          key={x}
          x={x - 35}
          y={floors === 2 ? 157 : 230}
          width="58"
          height="60"
          rx="8"
          fill="#b4e9f3"
          stroke="white"
          strokeWidth="7"
        />
      ))}
      {floors === 2 &&
        [145, 365].map((x) => (
          <rect
            key={x}
            x={x - 34}
            y="288"
            width="62"
            height="66"
            rx="10"
            fill="#b4e9f3"
            stroke="white"
            strokeWidth="7"
          />
        ))}
      <rect
        x="252"
        y="311"
        width="75"
        height="70"
        rx="15"
        fill="#9b7cb3"
        stroke="#fff4d0"
        strokeWidth="7"
      />
      <text x="285" y="405" fill="#4d675d" fontSize="33" fontWeight="bold" textAnchor="middle">
        {level.name}
      </text>
      {tier === 4 && (
        <>
          <path
            d="M75 130V36H135V130M440 130V36H501V130"
            fill="#dfc0e6"
            stroke="#fff0ca"
            strokeWidth="12"
          />
          <text x="280" y="15" textAnchor="middle" fontSize="45">
            👑
          </text>
        </>
      )}
    </svg>
  );
}

export function PlaneArt() {
  return (
    <g>
      <ellipse cx="0" cy="8" rx="120" ry="30" fill="#ff7b6b" stroke="#fff4e0" strokeWidth="7" />
      <path d="M-30 -2L-70 -70H-35L18 -2Z" fill="#ffd36e" stroke="#fff4e0" strokeWidth="5" />
      <path d="M-30 14L-72 76H-37L18 14Z" fill="#ffd36e" stroke="#fff4e0" strokeWidth="5" />
      <path d="M-108 4L-134 -42H-110L-84 -2Z" fill="#ffd36e" stroke="#fff4e0" strokeWidth="5" />
      <ellipse cx="72" cy="2" rx="30" ry="16" fill="#aee9f2" stroke="#fff" strokeWidth="4" />
      <circle cx="132" cy="8" r="8" fill="#555" />
    </g>
  );
}

const YARD_SPOTS: Record<string, { x: number; y: number; size: number }> = {
  "porch-pumpkin": { x: 150, y: 330, size: 60 },
  lights: { x: 175, y: 110, size: 44 },
  banner: { x: 175, y: 75, size: 40 },
  "ghost-gate": { x: 330, y: 330, size: 64 },
};
export function YardDecor({ items }: { items: readonly string[] }) {
  return (
    <g aria-hidden="true">
      {items.map((id) => {
        const spot = YARD_SPOTS[id];
        const emoji = YARD.find((y) => y.id === id)?.emoji;
        if (!spot || !emoji) return null;
        return (
          <text key={id} x={spot.x} y={spot.y} fontSize={spot.size} textAnchor="middle">
            {id === "lights" ? "✨ ✨ ✨ ✨ ✨" : emoji}
          </text>
        );
      })}
    </g>
  );
}
