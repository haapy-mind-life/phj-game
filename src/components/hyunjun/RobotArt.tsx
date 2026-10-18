export function RobotArt({ moving = false }: { moving?: boolean }) {
  return (
    <svg
      className={`hj-robot${moving ? " moving" : ""}`}
      viewBox="0 0 120 170"
      width="100"
      height="142"
      role="img"
      aria-label="팔다리가 있는 아빠 로봇"
    >
      <ellipse cx="60" cy="158" rx="34" ry="6" fill="#355e6426" />
      <g className="hj-robot-leg left">
        <path d="M43 121v22" stroke="#5394ad" strokeWidth="14" strokeLinecap="round" />
        <rect x="26" y="140" width="27" height="13" rx="6" fill="#f4cf73" />
      </g>
      <g className="hj-robot-leg right">
        <path d="M77 121v22" stroke="#5394ad" strokeWidth="14" strokeLinecap="round" />
        <rect x="67" y="140" width="27" height="13" rx="6" fill="#f4cf73" />
      </g>
      <g className="hj-robot-arm left">
        <path d="M32 86 17 112" stroke="#7cc5d5" strokeWidth="14" strokeLinecap="round" />
        <circle cx="16" cy="115" r="9" fill="#f4cf73" />
      </g>
      <g className="hj-robot-arm right">
        <path d="M88 86 103 112" stroke="#7cc5d5" strokeWidth="14" strokeLinecap="round" />
        <circle cx="104" cy="115" r="9" fill="#f4cf73" />
      </g>
      <rect
        x="30"
        y="72"
        width="60"
        height="58"
        rx="18"
        fill="#8fd1df"
        stroke="#f7edca"
        strokeWidth="4"
      />
      <rect x="43" y="91" width="34" height="25" rx="8" fill="#edf9f6" />
      <path d="m60 96 3 5 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1" fill="#edbd5b" />
      <path d="M60 26V14" stroke="#699fb4" strokeWidth="6" />
      <circle cx="60" cy="10" r="7" fill="#f4cf73" />
      <rect x="13" y="40" width="12" height="24" rx="6" fill="#efc769" />
      <rect x="95" y="40" width="12" height="24" rx="6" fill="#efc769" />
      <rect
        x="22"
        y="25"
        width="76"
        height="58"
        rx="21"
        fill="#f2faf3"
        stroke="#75acbc"
        strokeWidth="4"
      />
      <rect x="31" y="38" width="58" height="29" rx="12" fill="#416b85" />
      <path
        d="M40 52q5-8 10 0m20 0q5-8 10 0"
        fill="none"
        stroke="#c8f6ee"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M52 73q8 7 16 0"
        fill="none"
        stroke="#7da6b2"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
