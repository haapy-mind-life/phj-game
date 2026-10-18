export function DadArt({ moving = false }: { moving?: boolean }) {
  return (
    <svg
      className={`hj-dad${moving ? " moving" : ""}`}
      viewBox="0 0 120 180"
      width="94"
      height="141"
      role="img"
      aria-label="사람 아빠"
    >
      <ellipse cx="60" cy="169" rx="32" ry="5" fill="#314c5d22" />
      <g className="hj-robot-leg left">
        <path d="M44 130v29" stroke="#5b6585" strokeWidth="15" strokeLinecap="round" />
        <path d="M30 163h24" stroke="#fff6e4" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g className="hj-robot-leg right">
        <path d="M76 130v29" stroke="#5b6585" strokeWidth="15" strokeLinecap="round" />
        <path d="M67 163h23" stroke="#fff6e4" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g className="hj-robot-arm left">
        <path d="M35 93 18 124" stroke="#729db0" strokeWidth="16" strokeLinecap="round" />
        <circle cx="17" cy="129" r="8" fill="#f9d6b9" />
      </g>
      <g className="hj-robot-arm right">
        <path d="M85 93 102 124" stroke="#729db0" strokeWidth="16" strokeLinecap="round" />
        <circle cx="103" cy="129" r="8" fill="#f9d6b9" />
      </g>
      <rect x="31" y="83" width="58" height="57" rx="19" fill="#729db0" />
      <path d="m45 85 15 17 15-17" fill="#fff4dc" />
      <path d="M60 101v30" stroke="#4e7c94" strokeWidth="3" />
      <circle cx="24" cy="57" r="8" fill="#f9d6b9" />
      <circle cx="96" cy="57" r="8" fill="#f9d6b9" />
      <rect x="25" y="24" width="70" height="66" rx="29" fill="#f9d6b9" />
      <path d="M25 52Q12 11 53 13Q99 4 96 53L84 38Q72 42 61 29Q45 46 29 40Z" fill="#57463f" />
      <rect
        x="32"
        y="50"
        width="23"
        height="18"
        rx="6"
        fill="#fff"
        fillOpacity=".4"
        stroke="#5f667d"
        strokeWidth="3"
      />
      <rect
        x="65"
        y="50"
        width="23"
        height="18"
        rx="6"
        fill="#fff"
        fillOpacity=".4"
        stroke="#5f667d"
        strokeWidth="3"
      />
      <path d="M55 57h10" stroke="#5f667d" strokeWidth="3" />
      <circle cx="44" cy="59" r="3" fill="#463d3b" />
      <circle cx="76" cy="59" r="3" fill="#463d3b" />
      <path
        d="M50 76q10 10 20 0"
        fill="none"
        stroke="#a56b63"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
