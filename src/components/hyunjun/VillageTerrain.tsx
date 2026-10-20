import { memo } from "react";
import { MAP, PORTALS } from "@/game/adventure";
import { VILLAGES } from "@/game/villages";
import type { GameState } from "@/lib/world-model";
import { GrowingHome, YardDecor } from "./UnifiedCoast";
const trees = Array.from({ length: 75 }, (_, i) => ({
  x: 80 + ((i * 379) % 2640),
  y: 80 + ((i * 587) % 1640),
})).filter(
  (p) =>
    Math.abs(p.y - 850) > 130 &&
    Math.abs(p.x - 1350) > 130 &&
    !PORTALS.some((g) => Math.hypot(g.x - p.x, g.y - p.y) < 180),
);
function Cottage({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="120" cy="180" rx="145" ry="25" fill="#46614d15" />
      <rect
        x="12"
        y="30"
        width="216"
        height="150"
        rx="18"
        fill="#fff6dc"
        stroke="#e6d4b5"
        strokeWidth="6"
      />
      <path d="M-10 55 120-28 250 55Z" fill={color} />
      <path
        d="M-10 55 120-28 250 55"
        fill="none"
        stroke="#ffffff80"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <rect x="98" y="96" width="45" height="84" rx="20" fill="#a48770" />
      <circle cx="132" cy="145" r="4" fill="#f3d98a" />
      {[37, 166].map((xx) => (
        <g key={xx}>
          <rect
            x={xx}
            y="85"
            width="40"
            height="43"
            rx="10"
            fill="#bddde0"
            stroke="white"
            strokeWidth="5"
          />
          <path d={`M${xx + 20} 86v42M${xx} 107h40`} stroke="white" strokeWidth="4" />
        </g>
      ))}
      <text x="120" y="76" textAnchor="middle" fontSize="15" fill="#665847">
        {label}
      </text>
    </g>
  );
}
export const VillageTerrain = memo(function VillageTerrain({
  houseTier,
  yard,
}: Pick<GameState, "houseTier" | "yard">) {
  return (
    <svg
      className="adv-terrain"
      viewBox="0 0 10200 1800"
      style={{ width: 10200, height: 1800 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="grass" width="95" height="83" patternUnits="userSpaceOnUse">
          <rect width="95" height="83" fill="#d7e7b9" />
          <path d="m20 30 3-6 3 6m44 37 3-5 3 5" fill="none" stroke="#bace9c" strokeWidth="2" />
          <circle cx="75" cy="22" r="2" fill="#f9f6d9" />
        </pattern>
      </defs>
      <rect width={MAP.width} height={MAP.height} fill="url(#grass)" />
      <path
        d="M2700 850H5600M0 850H90M3200 400V1500M4000 400V1500M5000 400V1500M3200 500H5100M3200 1350H5100"
        stroke="#f5e7ca"
        strokeWidth="100"
        fill="none"
      />
      {VILLAGES.filter((v) => v.x > 2800 && v.y < 1800).map((v) => (
        <g key={v.id}>
          <ellipse cx={v.x} cy={v.y - 90} rx="245" ry="155" fill={v.color} opacity="0.7" />
          <text x={v.x} y={v.y - 235} textAnchor="middle" fontSize="30" fill="#40564d">
            {v.name}
          </text>
          {Array.from({ length: 12 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${v.x - 230 + (i % 6) * 90} ${v.y - 170 + Math.floor(i / 6) * 90})`}
            >
              {v.id === "apple" || v.id === "pineapple" ? (
                <>
                  <rect x="-5" y="5" width="10" height="40" rx="4" fill="#b48f69" />
                  <circle cy="-5" r="26" fill="#8cb589" />
                  <circle cx="10" cy="-4" r="10" fill={v.id === "apple" ? "#e48a7c" : "#f1cf66"} />
                </>
              ) : (
                <path
                  d="M0-22 18 0 0 24-18 0Z"
                  fill={v.id === "diamond" ? "#89bfe2" : v.id === "emerald" ? "#58aa8d" : "#78b8c0"}
                  stroke="white"
                  strokeWidth="3"
                />
              )}
            </g>
          ))}
        </g>
      ))}
      <text x="5010" y="370" textAnchor="middle" fontSize="30" fill="#6c6395">
        별자리 공방
      </text>
      <circle cx="5010" cy="430" r="48" fill="#b7abd8" />
      <text x="5010" y="448" textAnchor="middle" fontSize="50" fill="#fff2c1">
        ★
      </text>
      <ellipse cx="530" cy="1270" rx="350" ry="290" fill="#c5dca9" />
      <ellipse cx="1270" cy="360" rx="400" ry="230" fill="#c7dfc2" />
      <path
        d="M90 850H1600V620H2550V1100H2030M2550 850H2700M1350 120V1680M480 850V540M2380 620V520M550 850V1320M1250 850V390M2225 1100V1450"
        fill="none"
        stroke="#ecdbb8"
        strokeWidth="110"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M90 850H1600V620H2550V1100H2030M2550 850H2700M1350 120V1680"
        fill="none"
        stroke="#f5e7ca"
        strokeWidth="78"
        strokeLinecap="round"
      />
      <circle cx="1350" cy="850" r="155" fill="#f5e7ca" />
      <circle cx="1350" cy="815" r="68" fill="#e6d6be" />
      <circle cx="1350" cy="808" r="55" fill="#a7d6dc" />
      <circle cx="1350" cy="802" r="33" fill="#c8edf0" />
      <path
        d="M1350 802v-43m-14 20q14-25 28 0"
        fill="none"
        stroke="#fafff4"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect
        x="1740"
        y="710"
        width="650"
        height="310"
        rx="100"
        fill="#92cdd5"
        stroke="#bcdbb3"
        strokeWidth="22"
      />
      <path
        d="M1800 810q60-20 120 0m180 100q65-20 130 0m-340 20q45-10 90 0"
        stroke="#d3edf0"
        strokeWidth="5"
        fill="none"
      />
      <rect x="1985" y="970" width="100" height="98" rx="8" fill="#c49d79" />
      {[986, 1006, 1026, 1046].map((y) => (
        <path key={y} d={`M1985 ${y}h100`} stroke="#a78165" strokeWidth="3" />
      ))}
      <g transform="translate(245 155)">
        <GrowingHome tier={houseTier} />
        <YardDecor items={yard} />
      </g>
      <Cottage x={2100} y={1170} color="#92b8a0" label="FARM" />
      <g transform="translate(2260 300)">
        <rect x="5" y="15" width="30" height="155" rx="10" fill="#f2bd70" />
        <rect x="205" y="15" width="30" height="155" rx="10" fill="#f2bd70" />
        <rect
          y="0"
          width="240"
          height="70"
          rx="20"
          fill="#fdf6dc"
          stroke="#edbf7f"
          strokeWidth="6"
        />
        <text x="120" y="44" textAnchor="middle" fill="#73664e" fontSize="24">
          PARK RUNNER
        </text>
        <path d="M35 90h170" stroke="#fffdf2" strokeWidth="18" strokeDasharray="18 18" />
        <path
          d="M35 90h170"
          stroke="#879a8c"
          strokeWidth="18"
          strokeDasharray="18 18"
          strokeDashoffset="18"
        />
      </g>
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y})`}>
          <ellipse cy="35" rx="35" ry="12" fill="#597b4120" />
          <rect x="-7" y="0" width="14" height="40" rx="5" fill="#b79c79" />
          <circle cy="-10" r="39" fill={i % 2 ? "#9abf8e" : "#a8c790"} />
          <circle cx="-20" r="27" fill="#b8d29c" />
          <circle cx="22" cy="-3" r="25" fill="#a2c189" />
          {i % 3 === 0 && <circle cx="16" cy="-20" r="6" fill="#efd69b" />}
        </g>
      ))}
      <text x="550" y="1120" textAnchor="middle" fontSize="32" fill="#688756">
        토토의 보물 숲
      </text>
      <text x="1250" y="240" textAnchor="middle" fontSize="32" fill="#668a72">
        별빛 미니 파크
      </text>
      <text x="2065" y="820" textAnchor="middle" fontSize="28" fill="#4f93a1">
        반짝 호수
      </text>
      <g transform="translate(1110 280)">
        <path
          d="M0 70 25 0h80l25 70M25 0v55m80-55v55"
          stroke="#be9b7e"
          strokeWidth="8"
          fill="none"
        />
        <path d="M30 57h28m18 0h28" stroke="#e5a995" strokeWidth="9" />
      </g>
      <g transform="translate(500 1180)">
        <rect width="90" height="65" rx="12" fill="#c9a072" />
        <path d="M0 25h90M45 0v65" stroke="#f9df9b" strokeWidth="8" />
        <circle cx="45" cy="32" r="10" fill="#f4cf74" />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${2120 + i * 76} 1470)`}>
          <rect width="55" height="100" rx="15" fill="#c0a17b" />
          {[20, 50, 80].map((y) => (
            <path
              key={y}
              d={`M28 ${y + 10}v-15m0 8q-20 0-15-10 15 0 15 10 0-10 15-10 5 10-15 10`}
              stroke="#8db685"
              strokeWidth="5"
              fill="#a9c58e"
            />
          ))}
        </g>
      ))}
    </svg>
  );
});
