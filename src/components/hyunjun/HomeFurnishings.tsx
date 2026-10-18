import type { FurnitureId } from "@/lib/world-model";
import { homeFurniturePlacements } from "@/game/life-world";
function Furniture({ id }: { id: FurnitureId }) {
  const line = { stroke: "#897064", strokeWidth: 5 };
  if (id === "bed")
    return (
      <g>
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
    { id: "sofa" as const, x: 1390, y: 1050 },
    ...homeFurniturePlacements(room, tier),
  ];
  return (
    <g data-furniture-layer={front ? "front" : "back"}>
      {!front && (
        <g>
          <rect
            x="160"
            y="300"
            width="130"
            height="190"
            rx="15"
            fill="#bde0dd"
            stroke="#82a9a4"
            strokeWidth="5"
          />
          <path d="M160 370H290M270 330V350M270 405V440" stroke="#709d99" strokeWidth="6" />
          <rect
            x="480"
            y="300"
            width="440"
            height="100"
            rx="15"
            fill="#e8bd89"
            stroke="#c29a6c"
            strokeWidth="6"
          />
          <rect x="510" y="310" width="120" height="65" rx="10" fill="#f8f6df" />
          <circle cx="540" cy="340" r="15" fill="#758b8f" />
          <circle cx="600" cy="340" r="15" fill="#758b8f" />
          <rect x="690" y="310" width="120" height="65" rx="15" fill="#b3d9df" />
          <path d="M750 330V290H780" fill="none" stroke="#91a5a3" strokeWidth="8" />
          <rect
            x="1600"
            y="1000"
            width="250"
            height="150"
            rx="55"
            fill="#d3ac7b"
            stroke="#9c7c60"
            strokeWidth="7"
          />
          {[1645, 1730, 1810].map((x) => (
            <circle
              key={x}
              cx={x}
              cy="1060"
              r="26"
              fill="#fff9de"
              stroke="#9dc8c5"
              strokeWidth="4"
            />
          ))}
          <path
            d="M1580 1010V1130M1870 1010V1130"
            stroke="#ba9070"
            strokeWidth="24"
            strokeLinecap="round"
          />
          {tier >= 2 && (
            <g>
              <rect x="1330" y="340" width="550" height="220" rx="80" fill="#e7c1cf" />
              <path d="M1430 490L1480 400L1530 490Z" fill="#f5d276" />
              <rect x="1600" y="440" width="60" height="60" rx="9" fill="#89bcde" />
              <circle cx="1750" cy="460" r="42" fill="#94c996" />
            </g>
          )}
          {tier >= 4 && (
            <g>
              <path d="M1280 250Q1600 330 1970 250" stroke="#d3a34e" fill="none" strokeWidth="5" />
              {[1350, 1500, 1650, 1800, 1930].map((x, i) => (
                <path
                  key={x}
                  d={`M${x} 270l35 65 35-65Z`}
                  fill={["#eaa1a5", "#81baca", "#eccf7b"][i % 3]}
                />
              ))}
            </g>
          )}
        </g>
      )}
      {fixtures
        .filter((f) => f.y > playerY === front)
        .map((f, i) => (
          <g key={i} data-furniture={f.id} transform={`translate(${f.x} ${f.y})`}>
            <Furniture id={f.id} />
          </g>
        ))}
    </g>
  );
}
