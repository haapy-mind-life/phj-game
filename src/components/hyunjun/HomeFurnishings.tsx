import type { FurnitureId } from "@/lib/world-model";
import { homeFurniturePlacements } from "@/game/world/life-world";
function Furniture({ id }: { id: FurnitureId }) {
  const line = { stroke: "#897064", strokeWidth: 5 };
  if (id === "bed")
    return (
      <g>
        <path d="M-110 5H110V35H-110Z" fill="#a17ba5" />
        <rect x="-110" y="-160" width="220" height="180" rx="25" fill="#c4a0c9" {...line} />
        <rect x="-96" y="-145" width="192" height="145" rx="20" fill="#fffcf0" />
        <rect x="-84" y="-78" width="168" height="78" rx="14" fill="#a6dbe6" />
        <rect x="-65" y="-136" width="130" height="42" rx="18" fill="white" />
        <path d="M-102 20V40M102 20V40" {...line} />
      </g>
    );
  if (id === "sofa")
    return (
      <g>
        <rect x="-125" y="-120" width="250" height="130" rx="28" fill="#eeb3ad" {...line} />
        <rect x="-95" y="-100" width="85" height="82" rx="18" fill="#ffd3bd" />
        <rect x="10" y="-100" width="85" height="82" rx="18" fill="#ffd3bd" />
        <rect x="-135" y="-75" width="40" height="100" rx="18" fill="#db928f" />
        <rect x="95" y="-75" width="40" height="100" rx="18" fill="#db928f" />
      </g>
    );
  if (id === "rug")
    return (
      <g>
        <ellipse rx="140" ry="65" fill="#b3d6bb" stroke="#f7df92" strokeWidth="12" />
        <ellipse rx="100" ry="42" fill="none" stroke="#fff5cf" strokeWidth="6" />
      </g>
    );
  if (id === "plant")
    return (
      <g>
        <path d="M-35-40H35L25 10H-25Z" fill="#e5a77c" {...line} />
        <path d="M0-40V-145" stroke="#65a57a" strokeWidth="9" />
        {[-100, -65].map((y) => (
          <g key={y}>
            <ellipse
              cx="-20"
              cy={y}
              rx="29"
              ry="14"
              fill="#7cb991"
              transform={`rotate(25 -20 ${y})`}
            />
            <ellipse
              cx="20"
              cy={y - 18}
              rx="29"
              ry="14"
              fill="#96c88c"
              transform={`rotate(-25 20 ${y - 18})`}
            />
          </g>
        ))}
      </g>
    );
  if (id === "shelf")
    return (
      <g>
        <path d="M90-160l20-16V0L90 15Z" fill="#9e754d" />
        <rect x="-90" y="-160" width="180" height="175" rx="12" fill="#c59968" {...line} />
        {[-120, -50].map((y, i) => (
          <g key={y}>
            <path d={`M-80 ${y + 50}H80`} stroke="#f6e3bd" strokeWidth="8" />
            {[0, 1, 2, 3, 4].map((j) => (
              <rect
                key={j}
                x={-70 + j * 29}
                y={y}
                width="20"
                height="45"
                rx="4"
                fill={["#e6a59a", "#9acac0", "#e9cd81"][(j + i) % 3]}
              />
            ))}
          </g>
        ))}
      </g>
    );
  if (id === "window")
    return (
      <g>
        <rect
          x="-95"
          y="-160"
          width="190"
          height="135"
          rx="28"
          fill="#a8dbe5"
          stroke="white"
          strokeWidth="12"
        />
        <path d="M0-155V-30M-90-90H90" stroke="white" strokeWidth="8" />
        <path d="M-90-150Q0-210 90-150" stroke="#eeab9c" strokeWidth="15" fill="none" />
      </g>
    );
  if (id === "lamp")
    return (
      <g>
        <ellipse cy="10" rx="45" ry="12" fill="#b08b66" />
        <path d="M0 5V-130" stroke="#9b8064" strokeWidth="9" />
        <path d="M-40-175H40L70-100H-70Z" fill="#ffe3a0" stroke="#d2ab68" strokeWidth="5" />
        <circle cy="-120" r="15" fill="#fff5c9" />
      </g>
    );
  return (
    <g fill="#c79670" {...line}>
      <circle cx="-40" cy="-110" r="22" />
      <circle cx="40" cy="-110" r="22" />
      <ellipse cy="-40" rx="48" ry="50" />
      <circle cy="-95" r="47" />
      <ellipse cy="-80" rx="24" ry="16" fill="#fbe3bc" />
      <circle cx="-17" cy="-104" r="4" fill="#57463e" />
      <circle cx="17" cy="-104" r="4" fill="#57463e" />
      <ellipse cy="-83" rx="7" ry="5" fill="#57463e" />
    </g>
  );
}
function Kitchen() {
  return (
    <g data-home-fixture="kitchen">
      <ellipse cx="-40" cy="6" rx="315" ry="26" fill="#83694b22" />
      <path d="M-330-220l25-16h120v223l-25 14Z" fill="#81b7b5" />
      <rect
        x="-330"
        y="-220"
        width="120"
        height="220"
        rx="12"
        fill="#c4e4db"
        stroke="#819e91"
        strokeWidth="5"
      />
      <path d="M-330-145h120m-20-48v22m0 48v46" stroke="#779e94" strokeWidth="6" />
      <path d="M-130-90H300V0H-130Z" fill="#d2a277" stroke="#ab8060" strokeWidth="5" />
      <path d="M300-90l25-25v90L300 0" fill="#b78c68" />
      <path d="M-145-90l25-35h445l-25 35Z" fill="#fff4db" stroke="#bf9875" strokeWidth="5" />
      {[-105, 25, 155].map((x) => (
        <g key={x}>
          <rect x={x} y="-72" width="110" height="60" rx="6" fill="#e6bb91" />
          <path d={`M${x + 42}-58h26`} stroke="#98745e" strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx="-50" cy="-109" rx="41" ry="13" fill="#7a8c8c" />
      <ellipse cx="52" cy="-109" rx="32" ry="13" fill="#b3d6da" />
      <path d="M53-110v-37q0-17 22-17" fill="none" stroke="#8caaa5" strokeWidth="7" />
      <ellipse cx="230" cy="-111" rx="47" ry="17" fill="#fffcf2" stroke="#d7b48a" strokeWidth="3" />
      <text x="230" y="-111" fontSize="37" textAnchor="middle">
        🍕
      </text>
      <text x="220" y="40" fontSize="24" textAnchor="middle" fill="#8b725d">
        음식 집기 ↑
      </text>
    </g>
  );
}
function DiningTable() {
  return (
    <g data-home-fixture="dining">
      <ellipse cy="10" rx="160" ry="34" fill="#83694b22" />
      <path d="M-115-35v65m230-65v65" stroke="#99734f" strokeWidth="17" strokeLinecap="round" />
      <rect x="-155" y="-85" width="310" height="75" rx="34" fill="#b88b61" />
      <ellipse cy="-85" rx="155" ry="60" fill="#ebc895" stroke="#b88b61" strokeWidth="6" />
      {[-85, 85].map((x) => (
        <g key={x}>
          <ellipse
            cx={x}
            cy="-84"
            rx="38"
            ry="21"
            fill="#fffcf1"
            stroke="#9ec5c2"
            strokeWidth="4"
          />
          <path d={`M${x - 48}-99v30m4-30v11`} stroke="#a3aba1" strokeWidth="3" />
        </g>
      ))}
      <path d="M0-85v-42" stroke="#7ca77e" strokeWidth="5" />
      <ellipse cy="-80" rx="16" ry="10" fill="#a9ccc2" />
      <circle cy="-129" r="13" fill="#eca9a0" />
      <text y="70" fontSize="24" fill="#8b725d" textAnchor="middle">
        식탁에서 먹기 ↑
      </text>
    </g>
  );
}
export function HomeFurnishings({
  room,
  tier,
  playerY,
  front = false,
}: {
  room: (FurnitureId | null)[];
  tier: number;
  playerY: number;
  front?: boolean;
}) {
  const fixtures = [
    { id: "sofa" as const, x: 1840, y: 1150 },
    ...homeFurniturePlacements(room, tier),
  ];
  const standing = fixtures.filter((f) => f.id !== "rug" && f.id !== "window");
  return (
    <g data-furniture-layer={front ? "front" : "back"}>
      {!front && (
        <>
          {fixtures
            .filter((f) => f.id === "rug")
            .map((f, i) => (
              <g key={i} transform={`translate(${f.x} ${f.y})`}>
                <Furniture id="rug" />
              </g>
            ))}
          {fixtures
            .filter((f) => f.id === "window")
            .map((f, i) => (
              <g
                key={i}
                data-furniture="window"
                transform={`translate(${Math.max(600, Math.min(1900, f.x))} 270)`}
              >
                <Furniture id="window" />
              </g>
            ))}
          {tier >= 2 && (
            <g transform="translate(1600 460)">
              <ellipse rx="220" ry="85" fill="#e8c9d2" stroke="#fff5e6" strokeWidth="8" />
              <rect x="-85" y="-40" width="58" height="58" rx="8" fill="#98bdd9" />
              <path d="m70-56 35 70H35Z" fill="#e8c875" />
              <circle cx="-5" cy="38" r="26" fill="#a6c99c" />
            </g>
          )}
          {tier >= 4 && (
            <path d="M1280 250Q1600 330 1970 250" stroke="#d3a34e" fill="none" strokeWidth="5" />
          )}
        </>
      )}
      {[
        ...standing.map((f, i) => ({
          key: `f${i}`,
          y: f.y,
          node: (
            <g data-furniture={f.id} transform={`translate(${f.x} ${f.y})`}>
              <ellipse cy="22" rx={f.id === "plant" ? 45 : 105} ry="18" fill="#83694b22" />
              <Furniture id={f.id} />
            </g>
          ),
        })),
        {
          key: "kitchen",
          y: 555,
          node: (
            <g transform="translate(680 555)">
              <Kitchen />
            </g>
          ),
        },
        {
          key: "table",
          y: 1070,
          node: (
            <g transform="translate(1450 1070)">
              <DiningTable />
            </g>
          ),
        },
      ]
        .filter((f) => f.y > playerY === front)
        .sort((a, b) => a.y - b.y)
        .map((f) => (
          <g key={f.key}>{f.node}</g>
        ))}
    </g>
  );
}
