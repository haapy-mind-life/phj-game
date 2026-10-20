/** Shared beach props use ground-level origins, like characters. */
export function BeachProp({ kind }: { kind: number }) {
  return (
    <g data-beach-prop={kind}>
      <ellipse cy="8" rx={kind === 2 ? 28 : 65} ry="18" fill="#95754a26" />
      {kind === 0 ? (
        <>
          <path d="M0 0Q-16-65 8-140" stroke="#b68a59" strokeWidth="17" fill="none" />
          <path
            d="M8-140Q-52-182-79-124Q-33-143 8-132Q68-181 94-125Q46-147 8-132Q-2-190-39-179Q-16-159 8-132Q42-198 61-172Q36-151 8-132"
            fill="#70a782"
            stroke="#5d9472"
            strokeWidth="3"
          />
          <circle cx="5" cy="-132" r="10" fill="#a47c53" />
        </>
      ) : kind === 1 ? (
        <>
          <ellipse cy="-1" rx="75" ry="32" fill="#f9edc7" />
          <path d="M0 0v-128" stroke="#b99572" strokeWidth="7" />
          <path d="M-90-94Q0-188 90-94Z" fill="#f4b7a2" stroke="#c88e7b" strokeWidth="4" />
          <path d="M-30-94Q-15-152 0-151Q20-145 30-94Z" fill="#fff1d1" />
          <path d="m-55-24 72 5-8 20-72-5Z" fill="#a8caca" />
        </>
      ) : (
        <path d="M-25 0Q-36-34 0-40Q36-34 25 0Z" fill="#f6c7b1" stroke="#cb9e83" strokeWidth="3" />
      )}
    </g>
  );
}
export function BeachTruck() {
  return (
    <g data-beach-structure="food-truck">
      <ellipse cy="14" rx="166" ry="29" fill="#8a6d4b26" />
      <path d="M130-142l32-24V-9L130 10Z" fill="#d69b60" />
      <rect
        x="-150"
        y="-142"
        width="280"
        height="145"
        rx="19"
        fill="#f6cb86"
        stroke="#b88b65"
        strokeWidth="5"
      />
      <path d="M-150-142l25-24h287l-32 24Z" fill="#ffe8b9" />
      <path d="M-160-142h300l-12-33h-270Z" fill="#e89b8c" />
      <rect
        x="-120"
        y="-122"
        width="160"
        height="68"
        rx="8"
        fill="#719b97"
        stroke="#fff1cf"
        strokeWidth="6"
      />
      <path d="M-140-125H55l20 23h-235Z" fill="#fff4d6" />
      <path d="M-140-125h30l-5 23h-30m65-23h30v23h-35m65-23h30l5 23H10" fill="#e89b8c" />
      <rect x="57" y="-120" width="55" height="110" rx="10" fill="#fff1cf" />
      <rect x="64" y="-112" width="41" height="44" rx="6" fill="#aed8d9" />
      <path d="M-132-49H47" stroke="#b1805e" strokeWidth="12" strokeLinecap="round" />
      <text x="-43" y="-63" textAnchor="middle" fontSize="28">
        🍕 🥤
      </text>
      {[-96, 100].map((x) => (
        <g key={x}>
          <circle cx={x} cy="5" r="24" fill="#59616b" />
          <circle cx={x} cy="5" r="11" fill="#d4dcd7" />
        </g>
      ))}
      <text y="-197" textAnchor="middle" fontSize="29" fill="#657457">
        바닷가 냠냠 트럭
      </text>
    </g>
  );
}
