import { createContext, useContext, memo, useMemo, type ReactNode } from "react";
import type { Point } from "@/game/adventure";
import { MAP } from "@/game/adventure";
import { visibleOffsets, worldDistance } from "@/game/world-space";
import { NEW_VILLAGES, RESTAURANTS, FESTIVALS } from "@/game/world-content";
const CopyOffset = createContext<Point>({ x: 0, y: 0 });
export function WorldCopies({
  center,
  w,
  h,
  children,
}: {
  center: Point;
  w: number;
  h: number;
  children: ReactNode;
}) {
  return (
    <>
      {visibleOffsets(center, w, h).map((o) => (
        <WorldCopy key={`${o.x},${o.y}`} x={o.x} y={o.y}>
          {children}
        </WorldCopy>
      ))}
    </>
  );
}
function WorldCopy({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const offset = useMemo(() => ({ x, y }), [x, y]);
  return (
    <div
      className="world-copy"
      style={{ width: MAP.width, height: MAP.height, transform: `translate(${x}px,${y}px)` }}
    >
      <CopyOffset.Provider value={offset}>{children}</CopyOffset.Provider>
    </div>
  );
}
/** Keep mission paint surfaces bounded, including wrapped world copies. */
export function WorldOverlay({ center, children }: { center: Point; children: ReactNode }) {
  const offset = useContext(CopyOffset);
  const left = Math.floor((center.x - offset.x - 768) / 256) * 256;
  const top = Math.floor((center.y - offset.y - 512) / 256) * 256;
  return (
    <svg
      className="kid-world-markers"
      width="2048"
      height="1536"
      style={{ left, top }}
      viewBox={`${left} ${top} 2048 1536`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const WorldExpansionArt = memo(function WorldExpansionArt({
  center,
  season,
  layer = "ground",
}: {
  center: Point;
  season: boolean;
  layer?: "ground" | "landmarks";
}) {
  const offset = useContext(CopyOffset);
  const left = Math.floor((center.x - offset.x - 768) / 256) * 256,
    top = Math.floor((center.y - offset.y - 512) / 256) * 256;
  const visible = NEW_VILLAGES.filter((v) => worldDistance(v, center) < 1600);
  return (
    <svg
      className={`expanded-terrain ${layer}`}
      width="2048"
      height="1536"
      style={{ left, top }}
      viewBox={`${left} ${top} 2048 1536`}
      aria-hidden="true"
    >
      {layer === "ground" && (
        <>
          <defs>
            <pattern id="new-grass" width="120" height="100" patternUnits="userSpaceOnUse">
              <rect width="120" height="100" fill="#dce9c5" />
              <path d="m22 32 4-7 4 7m55 45 4-7 4 7" stroke="#b9cfa6" fill="none" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width={MAP.width} height={MAP.height} fill="url(#new-grass)" />
          <rect x="7328" width="2910" height={MAP.height} fill="#ecdba9" />
          <rect x="7380" width="2820" height={MAP.height} fill="#78c8dc" />
          <path
            d={`M7400 0V${MAP.height}M10180 0V${MAP.height}`}
            stroke="#e3f7f4"
            strokeWidth="12"
            strokeDasharray="80 50"
          />
          {[1200, 3800, 6400, 12800, 17000].map((x) => (
            <path key={x} d={`M${x} 0V${MAP.height}`} stroke="#f5e7c9" strokeWidth="100" />
          ))}
          {[850, 3000, 5200, 7400, 9600].map((y) => (
            <path
              key={y}
              d={`M0 ${y}H7280M10300 ${y}H${MAP.width}`}
              stroke="#f5e7c9"
              strokeWidth="100"
            />
          ))}
          {visible.map((v, i) => (
            <g key={v.id}>
              <ellipse cx={v.x} cy={v.y - 130} rx="440" ry="260" fill={v.color} opacity=".65" />
              <text x={v.x} y={v.y - 440} textAnchor="middle" fontSize="42" fill="#54706b">
                {v.name}
              </text>
              {[-330, 330]
                .filter(
                  (dx) =>
                    !RESTAURANTS.some((r) => Math.hypot(r.x - v.x - dx, r.y - v.y + 260) < 250),
                )
                .map((dx) => (
                  <g key={dx} transform={`translate(${v.x + dx} ${v.y - 260})`}>
                    <rect
                      x="-90"
                      y="-80"
                      width="180"
                      height="140"
                      rx="20"
                      fill="#fff2d8"
                      stroke="#dfbea0"
                      strokeWidth="6"
                    />
                    <path d="M-110-80 0-165 110-80Z" fill={v.color} />
                    <rect x="-22" y="-10" width="44" height="70" rx="10" fill="#ae8d7c" />
                    <circle cx="-140" cy="10" r="42" fill={i % 2 ? "#98bb97" : "#a8c58b"} />
                  </g>
                ))}
              <circle cx={v.x} cy={v.y} r="115" fill="#f9eed5" />
              <text x={v.x} y={v.y + 15} textAnchor="middle" fontSize="36" fill="#8f9b7b">
                {v.symbol}
              </text>
            </g>
          ))}
        </>
      )}
      {layer === "landmarks" && (
        <>
          {RESTAURANTS.filter((r) => worldDistance(r, center) < 1400).map((r) => (
            <g key={r.id} transform={`translate(${r.x} ${r.y})`} data-restaurant={r.id}>
              <rect
                x="-155"
                y="-210"
                width="310"
                height="210"
                rx="24"
                fill="#fff2d8"
                stroke="#d8b99b"
                strokeWidth="6"
              />
              <path d="M-178-206H178L145-275H-145Z" fill={r.color} />
              <rect x="-153" y="-145" width="306" height="40" fill={r.color} />
              <text
                y="-169"
                textAnchor="middle"
                fontSize="35"
                fontWeight="bold"
                fill={r.id === "mcdonalds" ? "#ffdb53" : "#fff8df"}
              >
                {r.id === "mcdonalds" ? "M" : r.mark}
              </text>
              <rect x="-34" y="-82" width="68" height="82" rx="13" fill="#8eaaaa" />
              <rect x="-125" y="-81" width="65" height="54" rx="9" fill="#b9e0df" />
              <rect x="60" y="-81" width="65" height="54" rx="9" fill="#b9e0df" />
              <text y="40" textAnchor="middle" fontSize="27" fill="#5c6659">
                {r.name}
              </text>
            </g>
          ))}
          {FESTIVALS.filter((f) => worldDistance(f, center) < 1400).map((f) => (
            <g key={f.id} transform={`translate(${f.x} ${f.y})`}>
              <circle r="180" fill={season ? "#ead1ac" : "#c5deba"} />
              <path
                d="M-190-150Q0-70 190-150"
                fill="none"
                stroke={season ? "#ae8ab4" : "#8eae93"}
                strokeWidth="8"
              />
              <text y="-130" textAnchor="middle" fontSize="34" fill="#665c76">
                {season ? "🎃 " + f.name : "친구 공원"}
              </text>
              <text y="20" textAnchor="middle" fontSize="62">
                {season ? "🎃 🍬 👻" : "🌷 🌳 🌷"}
              </text>
              <text y="90" textAnchor="middle" fontSize="25" fill="#665c76">
                {season ? "가까이 와서 축제에 참여해 봐!" : "할로윈 축제는 10월에 열려요"}
              </text>
            </g>
          ))}
          <g transform="translate(10300 1010)">
            <rect x="-150" y="25" width="250" height="45" rx="8" fill="#b89773" />
            <text y="-90" textAnchor="middle" fontSize="30">
              동쪽 잠수함 항구
            </text>
            <text y="0" textAnchor="middle" fontSize="65">
              ⚓
            </text>
          </g>
        </>
      )}
    </svg>
  );
});

// Background tiles have generous overscan; only rebuild them when entering another tile.
export function WorldExpansion({
  center,
  season,
  layer = "ground",
}: {
  center: Point;
  season: boolean;
  layer?: "ground" | "landmarks";
}) {
  const x = Math.floor(center.x / 256) * 256,
    y = Math.floor(center.y / 256) * 256;
  const tile = useMemo(() => ({ x, y }), [x, y]);
  return <WorldExpansionArt center={tile} season={season} layer={layer} />;
}

export function LegacySection({
  center,
  w,
  h,
  children,
}: {
  center: Point;
  w: number;
  h: number;
  children: ReactNode;
}) {
  const o = useContext(CopyOffset),
    x = center.x - o.x,
    y = center.y - o.y;
  if (x + w / 2 < -300 || x - w / 2 > 10500 || y + h / 2 < -300 || y - h / 2 > 2100) return null;
  return <>{children}</>;
}
