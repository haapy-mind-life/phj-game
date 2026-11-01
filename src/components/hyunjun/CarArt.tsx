import type { Car } from "@/game/economy/cars";
export function CarArt({ car, size = 110 }: { car: Car; size?: number }) {
  const large = car.kind === "monster";
  const long = ["bus", "fire", "ambulance", "camper", "foodtruck", "limo"].includes(car.kind);
  const x = long ? 8 : 17;
  const y = large ? 29 : car.kind === "sport" ? 49 : 37;
  const h = large ? 40 : car.kind === "sport" ? 23 : 34;
  const r = large ? 16 : 10;
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 148 100" role="img" aria-label={car.name}>
      <ellipse cx="75" cy="85" rx="61" ry="8" fill="#345b4830" />
      {car.kind === "excavator" && (
        <path
          d="M72 36 L96 7 L127 22 L129 41"
          stroke="#e5ad42"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {car.kind === "fire" && (
        <path d="M35 31 H116 M40 24 H111 M42 17 H109" stroke="#faf5df" strokeWidth="5" />
      )}
      {car.kind === "space" && (
        <path d="M71 36 Q74 -8 91 14 L104 38 Z" fill="#c9e7fc" stroke="#7d9acc" strokeWidth="3" />
      )}
      <rect
        x={x}
        y={y}
        width={long ? 127 : 113}
        height={h + 20}
        rx={r}
        fill={car.color}
        stroke="#4b6670"
        strokeWidth="3"
      />
      {car.kind === "sport" ? (
        <path d="M40 49 L62 31 H92 L115 49 Z" fill="#9ee5ed" stroke="#f9f7e8" strokeWidth="3" />
      ) : (
        <path
          d={long ? "M25 38 H114 V57 H25Z" : "M43 38 L55 19 H101 L116 38Z"}
          fill="#a5e8ee"
          stroke="#fdf9eb"
          strokeWidth="3"
        />
      )}
      {long &&
        [48, 76, 104].map((cx) => (
          <path key={cx} d={`M${cx} 39 V57`} stroke="white" strokeWidth="3" />
        ))}
      {car.kind === "police" && (
        <>
          <rect x="65" y="28" width="27" height="9" rx="3" fill="#4167d5" />
          <rect x="65" y="28" width="13" height="9" rx="3" fill="#f76464" />
        </>
      )}
      {car.kind === "ambulance" && (
        <path d="M73 64 V79 M65 71 H81" stroke="#fff9e9" strokeWidth="6" />
      )}
      {car.kind === "taxi" && (
        <rect x="64" y="29" width="32" height="9" rx="3" fill="#fff9e2" stroke="#5e6b6d" />
      )}
      {car.kind === "camper" && <rect x="91" y="62" width="24" height="18" rx="3" fill="#fff8d9" />}
      {car.kind === "foodtruck" && (
        <>
          <path d="M25 62 H126 V79 H25Z" fill="#fce2a8" />
          <text x="72" y="75" fontSize="16" textAnchor="middle">
            🍕🥤
          </text>
        </>
      )}
      {car.kind === "limo" && (
        <>
          <rect x="27" y="62" width="95" height="18" rx="6" fill="#fff1ba" />
          <path d="M65 39V57M90 39V57" stroke="#ffffff" strokeWidth="3" />
        </>
      )}
      {car.kind === "monster" && (
        <path d="M31 50 L57 30 H90 L116 50" fill="none" stroke="#fff3c2" strokeWidth="5" />
      )}
      <circle
        cx={long ? 39 : 42}
        cy={large ? 80 : 83}
        r={large ? 17 : 12}
        fill="#333e4e"
        stroke="#d9e0db"
        strokeWidth="4"
      />
      <circle
        cx={long ? 113 : 107}
        cy={large ? 80 : 83}
        r={large ? 17 : 12}
        fill="#333e4e"
        stroke="#d9e0db"
        strokeWidth="4"
      />
      <circle cx={long ? 39 : 42} cy={large ? 80 : 83} r="4" fill="#fff7e3" />
      <circle cx={long ? 113 : 107} cy={large ? 80 : 83} r="4" fill="#fff7e3" />
      <rect x="124" y="65" width="9" height="7" rx="2" fill="#f9f1c7" />
      <text x="75" y="73" fill="#fffdf4" fontSize="11" fontWeight="bold" textAnchor="middle">
        {car.number}
      </text>
    </svg>
  );
}
