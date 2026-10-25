import type { Point } from "@/game/adventure";
import { worldDistance } from "@/game/world-space";
import { CONSTRUCTION, HOME_LOTS, ISLANDS, LANDMARKS } from "@/game/kid-world";
import { GrowingHome, YardDecor } from "./UnifiedCoast";
import { FriendArt } from "./FriendArt";

/** Islands sit on the ocean in the ground layer, below people and vehicles. */
export function KidIslands({ center }: { center: Point }) {
  return (
    <g data-layer="islands">
      {ISLANDS.filter((i) => worldDistance(i, center) < 1700 + Math.max(i.rx, i.ry)).map((i) => (
        <g key={i.id} data-island={i.id}>
          <ellipse cx={i.x} cy={i.y} rx={i.rx + 70} ry={i.ry + 60} fill="#bfeef2" opacity=".7" />
          <ellipse cx={i.x} cy={i.y} rx={i.rx + 30} ry={i.ry + 25} fill="#f2dfa4" />
          <ellipse cx={i.x} cy={i.y} rx={i.rx} ry={i.ry} fill={i.color} />
          {Array.from({ length: 6 }, (_, k) => (
            <text
              key={k}
              x={i.x + Math.cos(k * 1.05) * i.rx * 0.62}
              y={i.y + Math.sin(k * 1.05) * i.ry * 0.62}
              fontSize="54"
              textAnchor="middle"
            >
              {k % 2 ? "🌳" : "🌴"}
            </text>
          ))}
          <text x={i.x} y={i.y - 30} fontSize="70" textAnchor="middle">
            {i.emoji}
          </text>
          <text
            x={i.x}
            y={i.y + 50}
            fontSize="48"
            fontWeight="bold"
            textAnchor="middle"
            fill="#3f5a4c"
            stroke="#fffbe8"
            strokeWidth="10"
            paintOrder="stroke"
          >
            {i.name}
          </text>
        </g>
      ))}
    </g>
  );
}

function Building({
  x,
  y,
  name,
  color,
  emoji,
  tall,
}: {
  x: number;
  y: number;
  name: string;
  color: string;
  emoji: string;
  tall: boolean;
}) {
  const h = tall ? 380 : 240;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x="-150"
        y={-h}
        width="300"
        height={h - 20}
        rx="18"
        fill="#fff4de"
        stroke={color}
        strokeWidth="9"
      />
      <rect x="-165" y={-h - 26} width="330" height="46" rx="14" fill={color} />
      {Array.from({ length: tall ? 4 : 2 }, (_, row) =>
        [-95, -30, 35, 100].map((wx) => (
          <rect
            key={`${row}-${wx}`}
            x={wx - 22}
            y={-h + 40 + row * 72}
            width="44"
            height="44"
            rx="7"
            fill="#bfe5ee"
            stroke="white"
            strokeWidth="4"
          />
        )),
      )}
      <rect x="-32" y="-95" width="64" height="75" rx="12" fill="#a7887a" />
      <text y={-h - 40} textAnchor="middle" fontSize="64">
        {emoji}
      </text>
      <text y="30" textAnchor="middle" fontSize="34" fontWeight="bold" fill="#4f5f58">
        {name}
      </text>
    </g>
  );
}

function ConstructionSite({ floors }: { floors: number }) {
  return (
    <g transform={`translate(${CONSTRUCTION.x} ${CONSTRUCTION.y})`} data-construction={floors}>
      <rect
        x="-230"
        y="-330"
        width="460"
        height="290"
        rx="16"
        fill="#e9d3a5"
        stroke="#d29a3c"
        strokeWidth="8"
        strokeDasharray="30 18"
      />
      {Array.from({ length: floors }, (_, f) => (
        <g key={f}>
          <rect
            x="-90"
            y={-80 - f * 48}
            width="180"
            height="46"
            fill={f % 2 ? "#f0a35e" : "#e98a4a"}
            stroke="#fff3d8"
            strokeWidth="4"
          />
          <rect x="-60" y={-70 - f * 48} width="30" height="24" fill="#bfe5ee" />
          <rect x="30" y={-70 - f * 48} width="30" height="24" fill="#bfe5ee" />
        </g>
      ))}
      <path
        d="M150-60V-420M150-410H-120M150-380L90-410"
        stroke="#f2bb2e"
        strokeWidth="16"
        fill="none"
      />
      <path d="M-100-410V-300" stroke="#6b6b6b" strokeWidth="4" />
      <rect x="-118" y="-302" width="36" height="22" fill="#e98a4a" />
      <text x="-180" y="-60" fontSize="60">
        🚧
      </text>
      <text x="170" y="-60" fontSize="60">
        🚜
      </text>
      <text y="30" textAnchor="middle" fontSize="34" fontWeight="bold" fill="#7a5420">
        {floors >= CONSTRUCTION.floors
          ? "🎉 완성된 빌딩!"
          : `공사장 · ${floors}/${CONSTRUCTION.floors}층`}
      </text>
    </g>
  );
}

/** An empty fenced lot the family can move to. */
export function EmptyLot({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g transform={`translate(${x} ${y})`} data-empty-lot={name}>
      <rect
        x="-150"
        y="-260"
        width="300"
        height="220"
        rx="14"
        fill="#e7dcb6"
        stroke="#b9925f"
        strokeWidth="7"
        strokeDasharray="24 14"
      />
      <text y="-150" textAnchor="middle" fontSize="70">
        🏡
      </text>
      <text y="-80" textAnchor="middle" fontSize="28" fill="#6d5536" fontWeight="bold">
        이사 올 수 있는 집터
      </text>
      <text y="25" textAnchor="middle" fontSize="30" fill="#6d5536">
        {name}
      </text>
    </g>
  );
}

/** The grown home at a moved-to lot, drawn like the original at x≈480 (door at the lot point). */
export function HomeAtLot({
  x,
  y,
  tier,
  yard,
}: {
  x: number;
  y: number;
  tier: number;
  yard: readonly string[];
}) {
  return (
    <g transform={`translate(${x - 235} ${y - 410})`} data-home-lot="current">
      <GrowingHome tier={tier} />
      <YardDecor items={yard} />
    </g>
  );
}

export function KidLandmarks({
  center,
  homeLot,
  houseTier,
  yard,
  floors,
}: {
  center: Point;
  homeLot: string;
  houseTier: number;
  yard: readonly string[];
  floors: number;
}) {
  const near = (p: Point) => worldDistance(p, center) < 1500;
  return (
    <g data-layer="kid-landmarks">
      {LANDMARKS.filter(near).map((l) => (
        <Building key={l.id} {...l} tall={"tall" in l} />
      ))}
      {near(CONSTRUCTION) && <ConstructionSite floors={floors} />}
      {HOME_LOTS.filter((l) => l.id !== "original" && near(l)).map((l) =>
        l.id === homeLot ? (
          <HomeAtLot key={l.id} x={l.x} y={l.y} tier={houseTier} yard={yard} />
        ) : (
          <EmptyLot key={l.id} x={l.x} y={l.y} name={l.name} />
        ),
      )}
    </g>
  );
}

/** Extra people around the big burger restaurants (child request: "맥도날드 사람들도 많게"). */
export function BurgerCrowd() {
  return (
    <g data-crowd="burger">
      {[-300, -220, 200, 280, -120, 120].map((dx, i) => (
        <g key={dx} transform={`translate(${dx - 40} ${i > 3 ? 50 : -10}) scale(.9)`}>
          <FriendArt index={i * 3 + 1} />
        </g>
      ))}
    </g>
  );
}
