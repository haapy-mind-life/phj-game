import { PlayerAvatar } from "./PlayerAvatar";
import { RESTAURANT_ROOM as ROOM, type RESTAURANTS } from "@/game/world-content";
import type { Point } from "@/game/adventure";
import type { GameState } from "@/lib/world-model";
import { FriendArt } from "./FriendArt";
import { People } from "./People";
type Restaurant = (typeof RESTAURANTS)[number];
export function RestaurantScene({
  restaurant,
  player,
  state,
  moving,
  facing,
  meal,
  carrying,
  customerIndex,
  seconds,
  onTalk,
}: {
  restaurant: Restaurant;
  player: Point;
  state: GameState;
  moving: boolean;
  facing: number;
  meal: number | null;
  carrying: boolean;
  customerIndex: number;
  seconds: number;
  onTalk: (id: string) => void;
}) {
  return (
    <svg
      width={ROOM.width}
      height={ROOM.height}
      className="hj-life-scene"
      aria-label={`${restaurant.name} 실내`}
    >
      <rect width={ROOM.width} height={ROOM.height} fill="#e4d6c6" />
      <rect
        x="55"
        y="70"
        width="1390"
        height="970"
        rx="35"
        fill="#fff4dc"
        stroke="#c7aa91"
        strokeWidth="18"
      />
      <rect x="70" y="100" width="1360" height="180" rx="20" fill={restaurant.color} />
      <text x="750" y="140" fontSize="48" textAnchor="middle" fill="#fff4d7" fontWeight="bold">
        {restaurant.name}
      </text>
      {[210, 600, 1050].map((x) => (
        <g key={x}>
          <rect x={x} y="160" width="160" height="90" rx="14" fill="#fff8dc" />
          <text x={x + 80} y="225" fontSize="52" textAnchor="middle">
            {restaurant.emoji[Math.floor(x / 400)] ?? restaurant.emoji[0]}
          </text>
        </g>
      ))}
      <g transform="translate(380 260)">
        <FriendArt index={5} />
      </g>
      <rect x="180" y="370" width="570" height="70" rx="18" fill={restaurant.color} />
      <text x="430" y="490" textAnchor="middle" fontSize="30" fill="#76614f">
        주문 · 음식 받기
      </text>
      <rect
        x="940"
        y="630"
        width="310"
        height="180"
        rx="42"
        fill="#b99577"
        stroke="#f5d4aa"
        strokeWidth="10"
      />
      <rect x="880" y="675" width="50" height="85" rx="16" fill={restaurant.color} />
      <rect x="1270" y="675" width="50" height="85" rx="16" fill={restaurant.color} />
      <text x="1090" y="860" textAnchor="middle" fontSize="30" fill="#76614f">
        여기서 음식 먹기
      </text>
      <g transform="translate(1080 315)">
        <FriendArt index={8 + (customerIndex % 3)} />
      </g>
      <text x="1120" y="475" textAnchor="middle" fontSize="27" fill="#76614f">
        손님 · 음식 전달
      </text>
      <text x="750" y="1020" textAnchor="middle" fontSize="38" fill="#756650">
        🚪 마을로 나가기
      </text>
      <People
        state={state}
        scene="restaurant"
        player={player}
        seconds={seconds}
        moving={moving}
        onTalk={onTalk}
        svg
      />
      <g transform={`translate(${player.x} ${player.y})`}>
        <g transform={`scale(${facing} 1)`}>
          <PlayerAvatar outfit={state.outfit} moving={moving} svg />
        </g>
        {(meal !== null || carrying) && (
          <text x="65" y="-60" fontSize="62">
            {restaurant.emoji[meal ?? 0]}
          </text>
        )}
        <text textAnchor="middle" y="35" fontSize="26" fill="#405b64">
          현준이
        </text>
      </g>
    </svg>
  );
}
