const FRIENDS = [
  { body: "#f1bb86", head: "#f7d0a5", ears: "bear", hat: "#c97d69", mark: "✿", name: "곰 친구" },
  { body: "#9c91dd", head: "#eee8fc", ears: "cat", hat: "#725eac", mark: "★", name: "고양이 친구" },
  { body: "#73b9a6", head: "#e0fff2", ears: "robot", hat: "#467fba", mark: "⚙", name: "로봇 친구" },
  { body: "#f0aa8b", head: "#ffe5d2", ears: "fox", hat: "#e17c53", mark: "♥", name: "여우 친구" },
  { body: "#edc973", head: "#fff2c7", ears: "bird", hat: "#daa95e", mark: "♪", name: "새 친구" },
  { body: "#8bd2df", head: "#f4e4ff", ears: "dragon", hat: "#68b1b2", mark: "◆", name: "용 친구" },
  {
    body: "#b5d781",
    head: "#fff8db",
    ears: "frog",
    hat: "#679b6e",
    mark: "♣",
    name: "개구리 친구",
  },
  { body: "#d7a7cf", head: "#fff0eb", ears: "mouse", hat: "#ad78aa", mark: "☾", name: "생쥐 친구" },
  { body: "#9bb5d5", head: "#f2e6d0", ears: "dog", hat: "#677da7", mark: "✦", name: "강아지 친구" },
  { body: "#eebd85", head: "#fff8c7", ears: "alien", hat: "#bd8a60", mark: "✸", name: "우주 친구" },
] as const;
export const FRIEND_STYLES = FRIENDS;
export function FriendArt({ index, moving = false }: { index: number; moving?: boolean }) {
  const f = FRIENDS[((index % FRIENDS.length) + FRIENDS.length) % FRIENDS.length]!;
  const variant = Math.floor(index / FRIENDS.length);
  return (
    <svg
      className={`hj-friend-art${moving ? " moving" : ""}`}
      viewBox="0 0 110 138"
      width="83"
      height="105"
      role="img"
      aria-label={f.name}
    >
      <ellipse cx="55" cy="133" rx="31" ry="4" fill="#42583e24" />
      <g className="friend-leg left">
        <path d="M35 110V128" stroke="#5e7790" strokeWidth="12" strokeLinecap="round" />
        <path d="M29 129H43" stroke="#f5eedb" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g className="friend-leg right">
        <path d="M75 110V128" stroke="#5e7790" strokeWidth="12" strokeLinecap="round" />
        <path d="M68 129H83" stroke="#f5eedb" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g className="friend-arm left">
        <path d="M36 82 21 105" stroke={f.body} strokeWidth="13" strokeLinecap="round" />
      </g>
      <g className="friend-arm right">
        <path d="M74 82 89 105" stroke={f.body} strokeWidth="13" strokeLinecap="round" />
      </g>
      <rect
        x="29"
        y="75"
        width="52"
        height="47"
        rx="15"
        fill={f.body}
        stroke="#ffffff70"
        strokeWidth="2"
      />
      {f.ears === "bear" && (
        <>
          <circle cx="24" cy="30" r="18" fill={f.head} />
          <circle cx="86" cy="30" r="18" fill={f.head} />
        </>
      )}
      {f.ears === "cat" && (
        <path
          d="M13 46 L14 8 L42 30 M68 30 L96 8 L97 46"
          fill={f.head}
          stroke={f.hat}
          strokeWidth="3"
        />
      )}
      {f.ears === "fox" && (
        <path
          d="M8 45 L24 5 L43 31 M67 31 L86 5 L102 45"
          fill={f.head}
          stroke={f.hat}
          strokeWidth="3"
        />
      )}
      {f.ears === "mouse" && (
        <>
          <circle cx="18" cy="31" r="22" fill="#eac3d7" />
          <circle cx="92" cy="31" r="22" fill="#eac3d7" />
        </>
      )}
      {f.ears === "dog" && (
        <>
          <ellipse cx="14" cy="50" rx="13" ry="26" fill="#b99c7a" />
          <ellipse cx="96" cy="50" rx="13" ry="26" fill="#b99c7a" />
        </>
      )}
      {f.ears === "dragon" && <path d="M16 28 L33 4 L43 30 M67 30 L78 4 L96 28" fill={f.hat} />}
      {f.ears === "frog" && (
        <>
          <circle cx="29" cy="23" r="15" fill={f.hat} />
          <circle cx="81" cy="23" r="15" fill={f.hat} />
        </>
      )}
      {f.ears === "robot" && (
        <>
          <rect x="51" y="3" width="8" height="20" rx="3" fill={f.hat} />
          <circle cx="55" cy="6" r="7" fill="#f3c96e" />
        </>
      )}
      {f.ears === "alien" && (
        <>
          <path d="M55 16 L45 2 M55 16 L65 2" stroke={f.hat} strokeWidth="5" />
          <circle cx="45" cy="2" r="5" fill="#9acaad" />
          <circle cx="65" cy="2" r="5" fill="#9acaad" />
        </>
      )}
      {f.ears === "bird" && <path d="M39 22 Q47 4 55 17 Q64 0 73 22" fill={f.hat} />}
      <rect
        x="15"
        y="22"
        width="80"
        height="73"
        rx={f.ears === "robot" ? 15 : 33}
        fill={f.head}
        stroke={f.hat}
        strokeWidth="3"
      />
      {f.ears === "bird" && <path d="M48 61 L61 61 L55 75Z" fill="#e19c55" />}
      {f.ears === "robot" ? (
        <>
          <rect x="29" y="45" width="52" height="23" rx="5" fill="#4b7189" />
          <circle cx="41" cy="57" r="5" fill="#adf7ec" />
          <circle cx="69" cy="57" r="5" fill="#adf7ec" />
        </>
      ) : (
        <>
          <ellipse cx="38" cy="57" rx="6" ry={f.ears === "alien" ? 11 : 7} fill="#42525a" />
          <ellipse cx="72" cy="57" rx="6" ry={f.ears === "alien" ? 11 : 7} fill="#42525a" />
          <path
            d="M47 75 Q55 83 63 75"
            fill="none"
            stroke="#b87b7a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      <text x="55" y="105" textAnchor="middle" fontSize="20" fill="#fff8ea">
        {f.mark}
      </text>
      {variant === 1 && (
        <path
          d="M29 82Q55 94 81 82L76 96 58 92 50 110 39 101 43 91Z"
          fill="#f4d37a"
          stroke="#fff3ce"
          strokeWidth="2"
        />
      )}
      {variant >= 2 && (
        <g>
          <path d="M23 26Q55-7 87 26Z" fill="#c698c9" />
          <path d="M20 28h70" stroke="#fff0cd" strokeWidth="6" strokeLinecap="round" />
          <circle cx="55" cy="13" r="5" fill="#fff0cd" />
        </g>
      )}
    </svg>
  );
}
