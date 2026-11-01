import { memo } from "react";
import { MAP, type Point } from "@/game/world/adventure";
import {
  CAMP,
  STATIONS,
  WORLD_CALLS,
  streetRoute,
  thiefPosition,
  type CallStatus,
  type WorldCall,
} from "@/game/world/world-events";

type Props = {
  player: Point;
  call: WorldCall | null;
  phase: "idle" | CallStatus;
  progress: number;
  thiefStep: number;
  siren: boolean;
  diving: boolean;
  camping: boolean;
};

const buildings = [
  { key: "fire", x: 2850, y: 1040, title: "119 소방서", color: "#f7c2ac", symbol: "🚒" },
  { key: "police", x: 3730, y: 1040, title: "112 경찰서", color: "#bedbf8", symbol: "🚓" },
  { key: "ambulance", x: 4660, y: 1040, title: "119 응급센터", color: "#e9f2f0", symbol: "🚑" },
  { key: "apartment", x: 3480, y: 475, title: "무지개 아파트", color: "#e0c4ee", symbol: "🏢" },
  { key: "restaurant", x: 4250, y: 550, title: "행복 식당", color: "#f5d5a1", symbol: "🍽️" },
  { key: "market", x: 5200, y: 535, title: "친구 시장", color: "#f0b9ae", symbol: "🛍️" },
  { key: "plaza", x: 4790, y: 1325, title: "햇살 광장", color: "#c2d9ea", symbol: "🌳" },
];

function MapBuilding({ x, y, title, color, symbol }: (typeof buildings)[number]) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      <ellipse cy="20" rx="134" ry="24" fill="#32564328" />
      <rect
        x="-110"
        y="-142"
        width="220"
        height="150"
        rx="14"
        fill={color}
        stroke="#fff7e9"
        strokeWidth="7"
      />
      <path d="M-125-142H125L106-167H-106Z" fill="#887b8b" />
      {[-74, -23, 28, 79].map((xx) => (
        <rect
          key={xx}
          x={xx - 12}
          y="-109"
          width="32"
          height="35"
          rx="5"
          fill="#bce5eb"
          stroke="#fffdfa"
          strokeWidth="3"
        />
      ))}
      <rect
        x="-27"
        y="-56"
        width="54"
        height="64"
        rx="8"
        fill="#7d918d"
        stroke="#fffbe9"
        strokeWidth="4"
      />
      <text x="0" y="-121" textAnchor="middle" fontSize="21">
        {symbol}
      </text>
      <rect
        x="-115"
        y="19"
        width="230"
        height="39"
        rx="16"
        fill="#fff9e9"
        stroke="#d1d2ba"
        strokeWidth="3"
      />
      <text x="0" y="46" textAnchor="middle" fill="#465950" fontSize="23" fontWeight="700">
        {title}
      </text>
    </g>
  );
}

function WorldScenesArt({
  player,
  call,
  phase,
  progress,
  thiefStep,
  siren,
  diving,
  camping,
}: Props) {
  const target =
    call?.kind === "police" && phase === "dispatched" ? thiefPosition(thiefStep) : call;
  const route = call && phase === "dispatched" && target ? streetRoute(player, target) : [];
  const active = call && phase !== "resolved" && phase !== "idle";
  const fire = call?.id === "apartment-fire" && active;
  const missing = fire ? Math.max(0, 3 - progress) : 0;
  return (
    <svg
      className="hj-world-scenes"
      viewBox="0 0 5600 1800"
      width="5600"
      height="1800"
      aria-hidden="true"
    >
      <defs>
        <filter id="hj-rescue-glow">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <g className="hj-world-route">
        {route.length > 1 && (
          <>
            <polyline
              points={route.map((p) => p.x + "," + p.y).join(" ")}
              fill="none"
              stroke="#ffffff"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={route.map((p) => p.x + "," + p.y).join(" ")}
              fill="none"
              stroke="#288cc2"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="25 17"
              className="hj-route-line"
            />
          </>
        )}
      </g>
      {buildings.map((building) => (
        <MapBuilding
          key={building.key}
          x={building.x}
          y={building.y}
          title={building.title}
          color={building.color}
          symbol={building.symbol}
        />
      ))}
      {(["fire", "ambulance", "police"] as const).map((kind) => (
        <g key={kind}>
          <circle
            cx={STATIONS[kind].x}
            cy={STATIONS[kind].y}
            r="52"
            fill={call?.kind === kind && phase === "reported" ? "#ff8a68" : "#fff4d8"}
            stroke="#fff"
            strokeWidth="8"
            className={call?.kind === kind && phase === "reported" ? "hj-station-alert" : ""}
          />
          <text x={STATIONS[kind].x} y={STATIONS[kind].y + 16} textAnchor="middle" fontSize="45">
            {STATIONS[kind].badge}
          </text>
        </g>
      ))}
      <g transform={"translate(" + CAMP.x + " " + CAMP.y + ")"}>
        <ellipse cy="44" rx="128" ry="39" fill="#b0d19a" />
        <path d="M-100 32L-15-89L75 32Z" fill="#e2a77f" stroke="#fff1d9" strokeWidth="7" />
        <path d="M-15-89L75 32H-15Z" fill="#c57b76" />
        <path d="M-15 32L18-25L46 32Z" fill="#6f6672" />
        <rect x="-111" y="50" width="220" height="34" rx="14" fill="#fff8df" />
        <text x="0" y="74" textAnchor="middle" fontSize="23" fill="#4b634a">
          숲속 캠핑장
        </text>
        {camping && (
          <text x="123" y="-12" fontSize="53">
            ⛺
          </text>
        )}
      </g>
      {fire &&
        Array.from({ length: missing }, (_, i) => (
          <g key={i} className="hj-flame" transform={"translate(" + (3420 + i * 55) + " 365)"}>
            <path
              d="M0 52Q-29 22-9-5Q-4 14 5-21Q35 12 25 44Q10 71 0 52Z"
              fill="#f48d4f"
              stroke="#ffe1a3"
              strokeWidth="5"
            />
            <path d="M0 47Q-12 25 3 7Q19 34 12 48Z" fill="#ffe5a7" />
          </g>
        ))}
      {active && call && (
        <g>
          <circle
            cx={target!.x}
            cy={target!.y}
            r="72"
            fill="none"
            stroke="#f36f66"
            strokeWidth="13"
            strokeDasharray="24 14"
            className="hj-sos-ring"
          />
          <circle
            cx={target!.x}
            cy={target!.y}
            r="44"
            fill="#fff9e5"
            stroke="#e5a77e"
            strokeWidth="5"
          />
          <text x={target!.x} y={target!.y + 14} fontSize="40" textAnchor="middle">
            {call.kind === "fire" ? "🔥" : call.kind === "ambulance" ? "🧑" : "🏃"}
          </text>
          <rect
            x={target!.x - 160}
            y={target!.y - 136}
            width="320"
            height="50"
            rx="20"
            fill="#fffaf0"
          />
          <text
            x={target!.x}
            y={target!.y - 103}
            fontSize="24"
            fill="#654d48"
            fontWeight="700"
            textAnchor="middle"
          >
            {call.title}
          </text>
          {call.kind === "fire" && progress > 0 && (
            <g className="hj-water-jet">
              <path
                d={
                  "M" +
                  (target!.x - 175) +
                  " " +
                  (target!.y + 22) +
                  "Q" +
                  target!.x +
                  " " +
                  (target!.y - 120) +
                  " " +
                  (target!.x + 24) +
                  " " +
                  (target!.y - 6)
                }
                fill="none"
                stroke="#5ac7ec"
                strokeWidth="19"
                strokeDasharray="13 12"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
      )}
      {diving && (
        <g>
          {Array.from({ length: 17 }, (_, i) => (
            <g
              key={i}
              transform={
                "translate(" + (1790 + ((i * 173) % 510)) + " " + (748 + ((i * 97) % 220)) + ")"
              }
            >
              <circle
                r={7 + (i % 3) * 3}
                fill="none"
                stroke="#e5fcff"
                strokeWidth="4"
                className="hj-bubble"
              />
              {i % 3 === 0 && (
                <text x="16" y="16" fontSize="23">
                  🐟
                </text>
              )}
            </g>
          ))}
        </g>
      )}
      {siren && (
        <circle
          cx={player.x}
          cy={player.y - 17}
          r="58"
          stroke="#f06b5c"
          strokeWidth="9"
          fill="none"
          strokeDasharray="24 12"
          className="hj-sos-ring"
        />
      )}
    </svg>
  );
}
export const WorldScenes = memo(WorldScenesArt, (a, b) => {
  if (
    a.call !== b.call ||
    a.phase !== b.phase ||
    a.progress !== b.progress ||
    a.thiefStep !== b.thiefStep ||
    a.siren !== b.siren ||
    a.diving !== b.diving ||
    a.camping !== b.camping
  )
    return false;
  return (
    (!a.siren && !(a.call && a.phase === "dispatched")) ||
    (a.player.x === b.player.x && a.player.y === b.player.y)
  );
});
