import { useReducedMotion } from "./useReducedMotion";
import { FriendArt } from "./FriendArt";
import { RobotArt } from "./RobotArt";
import { characterUrl } from "@/game/character-art";
import type { Outfit } from "@/lib/world-model";
import type { Point } from "@/game/adventure";
import {
  FOOD_MENU,
  LIFE_MAPS,
  HOME_WALLS,
  LIFE_SPOTS,
  SEA_TREASURES,
  type LifeRegion,
  type FoodId,
} from "@/game/life-world";
import { CANDY_SPOTS, candySpotsForHouse, DECOR, type PlacedDecor } from "@/lib/world-model";

export function LifeWorldScene({
  region,
  player,
  outfit,
  moving,
  facing,
  following,
  holding,
  submarine,
  explored,
  houseTier,
  decor,
  candy,
  partyActive,
}: {
  region: Exclude<LifeRegion, "village">;
  player: Point;
  outfit: Outfit;
  moving: boolean;
  facing: number;
  following: boolean;
  holding: FoodId | null;
  submarine: boolean;
  explored: string[];
  houseTier: number;
  decor: PlacedDecor[];
  candy: string[];
  partyActive: boolean;
}) {
  const dim = LIFE_MAPS[region];
  const reducedMotion = useReducedMotion();
  return (
    <svg
      className="hj-life-scene"
      width={dim.width}
      height={dim.height}
      viewBox={`0 0 ${dim.width} ${dim.height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hj-ocean-water" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#7bd9ec" />
          <stop offset="1" stopColor="#136c9f" />
        </linearGradient>
      </defs>
      {region === "coast" && (
        <>
          <rect width={dim.width} height={dim.height} fill="#d7eec4" />
          <rect x="3320" width="480" height="1800" fill="url(#hj-ocean-water)" />
          <path
            d="M3300 0Q3250 190 3300 380T3300 760T3300 1140T3300 1600T3300 1800H3800V0"
            fill="#83dbe8"
          />
          <path
            d="M3190 0Q3250 460 3190 900T3190 1800"
            stroke="#f7e0a3"
            strokeWidth="175"
            fill="none"
          />
          <path
            d="M0 1050H3220M600 1050V1500M1150 1050V440M2000 1050V500M3000 1000V1400"
            stroke="#f8e6c4"
            strokeWidth="115"
            fill="none"
          />
          {Array.from({ length: 14 }, (_, i) => (
            <g key={i} transform={`translate(${180 + i * 230} ${i % 2 ? 250 : 1510})`}>
              <rect width="17" height="65" rx="5" fill="#b79a69" />
              <circle cy="-25" r="52" fill="#84bb86" />
            </g>
          ))}
          <g transform="translate(1200 780)">
            <rect
              x="-240"
              y="-270"
              width="490"
              height="325"
              rx="30"
              fill="#f4d7ed"
              stroke="#fff4d0"
              strokeWidth="13"
            />
            <path d="M-285-265L0-445L290-265Z" fill="#b685ce" />
            {[-160, -40, 80, 185].map((x) => (
              <rect
                key={x}
                x={x - 30}
                y="-220"
                width="70"
                height="85"
                rx="15"
                fill="#b9e9f0"
                stroke="white"
                strokeWidth="7"
              />
            ))}
            <rect
              x="-62"
              y="-105"
              width="125"
              height="160"
              rx="21"
              fill="#9a7ab7"
              stroke="#fffbda"
              strokeWidth="8"
            />
            <text y="-305" fontSize="38" fill="#fffef5" textAnchor="middle" fontWeight="bold">
              현준이 대왕집
            </text>
          </g>
          <g transform="translate(1980 740)">
            <rect
              x="-180"
              y="-120"
              width="350"
              height="174"
              rx="24"
              fill="#f4b35c"
              stroke="#f9f3e8"
              strokeWidth="9"
            />
            <rect x="-112" y="-72" width="225" height="80" rx="13" fill="#fff1d0" />
            <rect x="-88" y="8" width="170" height="14" fill="#e5a86a" />
            <path d="M-195-120H188L145-200H-145Z" fill="#df8e76" />
            <circle cx="-98" cy="58" r="40" fill="#485465" />
            <circle cx="106" cy="58" r="40" fill="#485465" />
            <text y="-145" fontSize="35" textAnchor="middle" fill="#fff7e5">
              푸드트럭
            </text>
            <text y="-25" textAnchor="middle" fontSize="49">
              🍕 🥤 🍛
            </text>
          </g>
          <g transform="translate(2270 910)">
            <FriendArt index={0} />
          </g>
          {!following && (
            <g transform="translate(1490 1250)">
              <g transform="translate(-50 -150)">
                <RobotArt />
              </g>
              <text x="0" y="-170" textAnchor="middle" fontSize="29" fill="#546d67">
                🤖 아빠 로봇
              </text>
            </g>
          )}
          <g transform="translate(3100 980)">
            <rect
              x="-130"
              y="-20"
              width="310"
              height="52"
              rx="12"
              fill="#a87b57"
              stroke="#f8e8bb"
              strokeWidth="7"
            />
            <text x="10" y="-70" textAnchor="middle" fill="#2e6174" fontWeight="bold" fontSize="40">
              잠수함 항구
            </text>
            <path
              d="M-135-35Q-120-125 10-135Q135-110 155-35Z"
              fill="#ffcf69"
              stroke="#f6f0d4"
              strokeWidth="8"
            />
            <circle cx="-38" cy="-81" r="27" fill="#b4eff6" />
            <circle cx="47" cy="-81" r="27" fill="#b4eff6" />
            <path d="M5-140V-205H85" stroke="#efc670" strokeWidth="20" fill="none" />
          </g>
          <text x="270" y="935" fontSize="44" fill="#607c60">
            ← 열 개 마을
          </text>
        </>
      )}
      {region === "mansion" && (
        <>
          <rect width={dim.width} height={dim.height} fill="#efdee2" />
          <rect
            x="90"
            y="100"
            width="2020"
            height="1260"
            rx="80"
            fill="#fff9e6"
            stroke="#d8b6a4"
            strokeWidth="24"
          />
          <path d="M1110 150V1300M170 750H2030" stroke="#f5e7c9" strokeWidth="150" />
          <rect x="125" y="190" width="850" height="470" rx="28" fill="#faeacb" />
          <rect x="1250" y="185" width="770" height="480" rx="28" fill="#f4e5f6" />
          <rect x="130" y="865" width="830" height="410" rx="34" fill="#e2ecfb" />
          <rect x="1205" y="865" width="770" height="410" rx="34" fill="#e7f1d9" />
          {HOME_WALLS.map((wall, i) => (
            <rect key={i} {...wall} rx="8" fill="#d8b6a4" />
          ))}
          <text x="500" y="275" fontSize="52" fill="#806a57">
            부엌
          </text>
          <text x="1550" y="270" fontSize="52" fill="#876e8b">
            큰 놀이방
          </text>
          <text x="470" y="940" fontSize="52" fill="#6d789d">
            침실
          </text>
          <text x="1500" y="930" fontSize="52" fill="#628060">
            식당
          </text>
          <text x="920" y="610" fontSize="120" textAnchor="middle">
            🍕
          </text>
          <text x="1400" y="1070" fontSize="105" textAnchor="middle">
            🍽️
          </text>
          <text x="510" y="1100" fontSize="115">
            🛏️
          </text>
          <text x="1550" y="430" fontSize="120">
            🧸
          </text>
          <text x="1850" y="430" fontSize="120">
            📚
          </text>
          {houseTier < 2 && (
            <g>
              <rect
                x="1250"
                y="185"
                width="770"
                height="480"
                rx="28"
                fill="#e2d9d3"
                opacity=".94"
              />
              <text x="1590" y="440" fontSize="32" textAnchor="middle" fill="#866f76">
                2단계 증축 후 놀이방 열림
              </text>
            </g>
          )}
          {houseTier < 3 && (
            <g>
              <rect x="130" y="865" width="830" height="410" rx="28" fill="#e4e1d9" opacity=".94" />
              <text x="510" y="1090" fontSize="32" textAnchor="middle" fill="#7e786d">
                3단계 증축 후 침실 열림
              </text>
            </g>
          )}
          {houseTier === 4 && (
            <g>
              <text x="1050" y="137" fontSize="74" textAnchor="middle">
                👑 🏰 👑
              </text>
              <text x="1450" y="1230" fontSize="55" fill="#b68c52">
                왕실 대저택 완성!
              </text>
            </g>
          )}
          {partyActive && (
            <g>
              <rect
                x="90"
                y="100"
                width="2020"
                height="1260"
                rx="80"
                fill="#5b2a8a"
                opacity=".22"
              />
              <text x="1050" y="1335" fontSize="52" textAnchor="middle" fill="#8a4a12">
                🎃 할로윈 파티! 사탕 {candy.length}/{CANDY_SPOTS.length}
              </text>
              {candySpotsForHouse(houseTier)
                .filter((c) => !candy.includes(c.id))
                .map((c) => (
                  <text key={c.id} x={c.x} y={c.y} fontSize="90" textAnchor="middle">
                    🍬
                  </text>
                ))}
            </g>
          )}
          {decor.map((d, i) => (
            <text key={i} x={d.x} y={d.y} fontSize="96" textAnchor="middle">
              {DECOR.find((x) => x.id === d.id)?.emoji}
            </text>
          ))}
          <text x="230" y="155" fontSize="48" fill="#846d72">
            현준이 집 Lv.{houseTier}/4
          </text>
          <text x={LIFE_SPOTS.mansionExit.x} y="1320" fontSize="62" textAnchor="middle">
            🚪
          </text>
          <text
            x={LIFE_SPOTS.mansionExit.x}
            y="1348"
            fontSize="33"
            textAnchor="middle"
            fill="#6c685b"
          >
            마당으로 나가기
          </text>
        </>
      )}
      {region === "deep-sea" && (
        <>
          <rect width={dim.width} height={dim.height} fill="url(#hj-ocean-water)" />
          {Array.from({ length: 46 }, (_, i) => (
            <circle
              key={i}
              cx={100 + ((i * 317) % 4050)}
              cy={70 + ((i * 211) % 1570)}
              r={8 + (i % 4) * 6}
              fill="none"
              stroke="#e4fcfc88"
              strokeWidth="5"
            />
          ))}
          <path
            d="M0 1570Q500 1450 1000 1560T2200 1520T3300 1560T4200 1500V1800H0Z"
            fill="#dbd1a4"
          />
          {Array.from({ length: 22 }, (_, i) => (
            <g key={i} transform={`translate(${260 + ((i * 341) % 3740)} ${1540 - (i % 3) * 80})`}>
              <path
                d="M0 80Q-65-20-25-100M0 80Q65-20 25-125M0 70V-100"
                stroke={i % 2 ? "#f0a2ac" : "#8ed2ba"}
                strokeWidth="21"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ))}
          {SEA_TREASURES.map((site) => (
            <g key={site.id} transform={`translate(${site.x} ${site.y})`}>
              <circle
                r="82"
                fill={explored.includes(site.id) ? "#a5efc3" : "#ffe4a0"}
                stroke="white"
                strokeDasharray="18 12"
                strokeWidth="8"
              />
              <text y="21" textAnchor="middle" fontSize="62">
                {explored.includes(site.id) ? "✅" : "🐚"}
              </text>
              <text
                y="-105"
                textAnchor="middle"
                fill="#fffcec"
                stroke="#307695"
                paintOrder="stroke"
                strokeWidth="4"
                fontSize="38"
                fontWeight="bold"
              >
                {site.name}
              </text>
            </g>
          ))}
          <text x="250" y="820" fill="#f6ffff" fontSize="43">
            ← 항구로 돌아가기
          </text>
          <text x="2750" y="400" fontSize="94">
            🐠 🐡 🐟
          </text>
          <text x="1700" y="1120" fontSize="112">
            🐙
          </text>
        </>
      )}
      {following && (
        <g transform={`translate(${Math.max(90, player.x - 105)} ${player.y + 10})`}>
          <g transform="translate(-55 -150)">
            <RobotArt moving={moving} />
          </g>
          <text x="0" y="-143" fontSize="25" textAnchor="middle" fill="#475960">
            아빠 로봇
          </text>
        </g>
      )}
      <g transform={`translate(${player.x} ${player.y})`}>
        {submarine ? (
          <>
            <ellipse cy="-15" rx="108" ry="48" fill="#ffd66d" stroke="#fff7c8" strokeWidth="8" />
            <circle cx="-30" cy="-26" r="20" fill="#90ddeb" />
            <circle cx="25" cy="-26" r="20" fill="#90ddeb" />
            <path d="M8-60V-110H67" fill="none" stroke="#ffc65f" strokeWidth="20" />
          </>
        ) : (
          <g transform={`scale(${facing} 1)`}>
            <image
              x="-72"
              y="-165"
              width="144"
              height="192"
              href={characterUrl(outfit, moving ? "walk" : "idle", false, reducedMotion)}
            />
          </g>
        )}
        {holding && (
          <text x="64" y="-80" fontSize={holding === "gold-pizza" ? 85 : 64}>
            {FOOD_MENU.find((f) => f.id === holding)?.emoji}
          </text>
        )}
        <rect x="-74" y="52" width="148" height="35" rx="15" fill="#fff9e0" />
        <text y="77" textAnchor="middle" fontSize="25" fill="#425c52" fontWeight="bold">
          현준이
        </text>
      </g>
    </svg>
  );
}
