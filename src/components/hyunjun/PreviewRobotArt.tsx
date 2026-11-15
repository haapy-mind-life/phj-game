import type { PreviewRobotId } from "@/game/robot/robot-preview";

// Card-size pictures for the "coming soon" robots, drawn from the 2026-11-08 concept sheets
// (docs/robot-fusion/2026-11-08-blue-gold). Machine visor only, never a human face.
const OUT = "#0d1f45";

/** Blue Cabi: pointed jaw, police-cap helmet with a lightning badge, two small sirens, small wings. */
function BlueCabi() {
  return (
    <g stroke={OUT} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={60} cy={112} rx={34} ry={5} fill="#000" opacity={0.18} stroke="none" />
      {/* small wings */}
      <path d="M30 50 L8 40 L14 64 L30 66 Z" fill="#5fd4ff" />
      <path d="M90 50 L112 40 L106 64 L90 66 Z" fill="#5fd4ff" />
      {/* legs: straight, silver */}
      <path d="M42 80 H56 V104 H40 Z" fill="#dfe9f2" />
      <path d="M64 80 H78 V104 H62 Z" fill="#dfe9f2" />
      <path d="M36 104 H58 V112 H34 Z" fill="#1d72ed" />
      <path d="M62 104 H84 V112 H62 Z" fill="#1d72ed" />
      {/* arms */}
      <path d="M26 50 H36 V78 H24 Z" fill="#2a8cff" />
      <path d="M84 50 H94 L96 78 H84 Z" fill="#2a8cff" />
      {/* body with lightning badge */}
      <path d="M34 46 H86 L82 84 H38 Z" fill="#1d72ed" />
      <path
        d="M60 52 L72 58 V70 L60 76 L48 70 V58 Z"
        fill="#0f2a66"
        stroke="#7fe3ff"
        strokeWidth={2.5}
      />
      <path d="M62 55 L54 66 H60 L57 74 L66 62 H60 Z" fill="#ffd23a" strokeWidth={1.5} />
      {/* head: pointed jaw, not square */}
      <path d="M40 22 H80 L82 34 L60 46 L38 34 Z" fill="#2a8cff" />
      <path d="M44 27 H76 L74 35 H46 Z" fill="#0f2a66" />
      <path d="M48 30 L57 32 M72 30 L63 32" stroke="#bff4ff" strokeWidth={3} />
      {/* police-cap helmet, lightning mark, two small sirens */}
      <path d="M36 22 Q60 6 84 22 Z" fill="#163a9c" />
      <path d="M61 11 L56 18 H60 L58 22 L64 15 H60 Z" fill="#ffd23a" strokeWidth={1.5} />
      <rect x={42} y={8} width={8} height={6} rx={2} fill="#ff4d5e" strokeWidth={2.5} />
      <rect x={70} y={8} width={8} height={6} rx={2} fill="#5fe3ff" strokeWidth={2.5} />
    </g>
  );
}

/** Golden Kaldkeite: pointed gold helmet with a crest, blue electric core, side fins; not Emblus. */
function GoldenKaldkeite() {
  return (
    <g stroke="#5a3408" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={60} cy={112} rx={36} ry={5} fill="#000" opacity={0.18} stroke="none" />
      {/* side fins */}
      <path d="M28 46 L6 30 L16 58 L28 62 Z" fill="#ffe27a" />
      <path d="M92 46 L114 30 L104 58 L92 62 Z" fill="#ffe27a" />
      {/* legs */}
      <path d="M40 80 H56 V104 H38 Z" fill="#ffc42e" />
      <path d="M64 80 H80 V104 H62 Z" fill="#ffc42e" />
      <path d="M33 104 H58 V112 H31 Z" fill="#d18a1c" />
      <path d="M62 104 H87 V112 H62 Z" fill="#d18a1c" />
      <path d="M40 92 H56 M64 92 H80" stroke="#7b4a10" strokeWidth={3} />
      {/* arms with steel joints */}
      <path d="M22 48 H36 V68 H24 Z" fill="#ffc42e" />
      <path d="M24 68 H36 V80 H26 Z" fill="#cfe2ef" />
      <path d="M84 48 H98 L96 68 H84 Z" fill="#ffc42e" />
      <path d="M84 68 H96 L94 80 H84 Z" fill="#cfe2ef" />
      {/* body with blue electric core */}
      <path d="M34 44 H86 L82 84 H38 Z" fill="#ffd34d" />
      <path
        d="M60 50 L74 57 V71 L60 78 L46 71 V57 Z"
        fill="#12306b"
        stroke="#fff1b0"
        strokeWidth={3}
      />
      <path d="M62 54 L53 66 H59 L56 75 L67 62 H61 Z" fill="#5fe3ff" strokeWidth={1.5} />
      {/* head: pointed gold helmet with crest and horns */}
      <path d="M40 22 H80 L84 32 L60 46 L36 32 Z" fill="#ffc42e" />
      <path d="M46 26 H74 L72 34 H48 Z" fill="#12306b" />
      <path d="M50 29 L57 31 M70 29 L63 31" stroke="#7fe3ff" strokeWidth={3} />
      <path d="M40 22 L32 8 L48 18 Z" fill="#ffe27a" />
      <path d="M80 22 L88 8 L72 18 Z" fill="#ffe27a" />
      <path d="M50 22 L60 2 L70 22 Z" fill="#fff1b0" />
    </g>
  );
}

export function PreviewRobotArt({
  id,
  size = 46,
  label,
}: {
  id: PreviewRobotId;
  size?: number;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-preview-art={id}
    >
      {id === "pv-bluecabi" ? <BlueCabi /> : <GoldenKaldkeite />}
    </svg>
  );
}
