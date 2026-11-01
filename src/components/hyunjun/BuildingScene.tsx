import {
  BUILDING_ROOM as ROOM,
  canWalkBuilding,
  type TownBuilding,
} from "@/game/world/building-interiors";
import type { Point } from "@/game/world/adventure";
import type { GameState } from "@/lib/world-model";
import { PlayerAvatar } from "./PlayerAvatar";
import { usePlayerIdentity } from "./useFamilyAccount";
import { People } from "./People";
import { DadArt } from "./DadArt";
import { FriendArt } from "./FriendArt";

export function BuildingScene({
  building,
  player,
  state,
  moving,
  facing,
  onTalk,
}: {
  building: TownBuilding;
  player: Point;
  state: GameState;
  moving: boolean;
  facing: number;
  onTalk: (id: string) => void;
}) {
  const identity = usePlayerIdentity();
  return (
    <svg
      width={ROOM.width}
      height={ROOM.height}
      className="hj-life-scene"
      aria-label={`${building.name} 실내`}
    >
      <rect width={ROOM.width} height={ROOM.height} fill="#e4d6c6" />
      <rect
        x="55"
        y="70"
        width="1390"
        height="970"
        rx="35"
        fill="#fff4dc"
        stroke={building.color}
        strokeWidth="18"
      />
      <rect x="70" y="100" width="1360" height="180" rx="20" fill={building.color} />
      <text x="750" y="185" fontSize="48" textAnchor="middle" fill="#354e53" fontWeight="bold">
        {building.emoji} {building.name}
      </text>
      <g transform="translate(160 470)">
        {building.id !== "dad-office" ? (
          <FriendArt index={5} />
        ) : (
          // A following dad is already drawn by People; avoid two dads.
          !state.companions.includes("dad") && (
            <g transform="translate(-47 -141)" data-office-dad>
              <DadArt />
            </g>
          )
        )}
      </g>
      <rect x="260" y="330" width="980" height="120" rx="20" fill="#c5a485" />
      <text x="750" y="415" fontSize="64" textAnchor="middle">
        {building.items}
      </text>
      <text x="750" y="305" fontSize="26" textAnchor="middle" fill="#67594c">
        {building.action} · 가까이 와서 행동을 눌러 봐!
      </text>
      {[190, 1310].map((x) => (
        <g key={x}>
          <rect x={x - 50} y="580" width="100" height="130" rx="20" fill={building.color} />
          <text x={x} y="655" fontSize="54" textAnchor="middle">
            🌷
          </text>
        </g>
      ))}
      <path d="M650 1025H850" stroke={building.color} strokeWidth="22" strokeLinecap="round" />
      <text x="750" y="1010" fontSize="36" textAnchor="middle" fill="#67594c">
        🚪 밖으로 나가기
      </text>
      <People
        state={state}
        scene="restaurant"
        player={player}
        seconds={0}
        moving={moving}
        onTalk={onTalk}
        canWalkInside={canWalkBuilding}
        svg
      />
      <g data-building-player transform={`translate(${player.x} ${player.y})`}>
        <g transform={`scale(${facing} 1)`}>
          <PlayerAvatar identity={identity.id} outfit={state.outfit} moving={moving} svg />
        </g>
        <text y="35" textAnchor="middle" fontSize="26" fill="#405b64">
          {identity.name}
        </text>
      </g>
    </svg>
  );
}
