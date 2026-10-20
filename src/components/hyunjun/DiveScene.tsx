import { usePlayerIdentity } from "./useFamilyAccount";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";
import { DIVE_SIZE, DIVE_TREASURES, stepDive } from "@/game/place-play";
import { characterUrl } from "@/game/character-art";
import { Joystick } from "./Joystick";
import { useMovement } from "./useMovement";
import { useReducedMotion } from "./useReducedMotion";
import { FriendArt } from "./FriendArt";
import { DadArt } from "./DadArt";
import { RobotArt } from "./RobotArt";
export function DiveScene({ onClose }: { onClose: () => void }) {
  const identity = usePlayerIdentity();
  const { state, dispatch } = useGame();
  const reduced = useReducedMotion();
  const [pos, setPos] = useState({ x: 350, y: 170 }),
    [found, setFound] = useState<string[]>([]),
    [ink, setInk] = useState(false),
    [hint, setHint] = useState("잠수! 아래로 내려가 반짝 보물 3개를 찾아 봐.");
  const [size, setSize] = useState({ w: 400, h: 600 });
  const root = useRef<HTMLDivElement>(null),
    elapsed = useRef(0),
    id = useRef(crypto.randomUUID()),
    collected = useRef<string[]>([]),
    rewarded = useRef(false),
    inkUntil = useRef(0);
  const near = DIVE_TREASURES.find(
    (t) => !found.includes(t.id) && Math.hypot(t.x - pos.x, t.y - pos.y) < 110,
  );
  function action() {
    if (ink) {
      inkUntil.current = 0;
      setInk(false);
      setHint("창문이 깨끗해졌어!");
      return;
    }
    if (!near) {
      setHint("반짝 보물 가까이 가서 집게를 눌러 봐.");
      return;
    }
    if (collected.current.includes(near.id)) return;
    const next = [...collected.current, near.id];
    collected.current = next;
    setFound(next);
    setHint(near.name + " 발견! " + next.length + "/3");
    if (next.length === 3 && !rewarded.current) {
      rewarded.current = true;
      dispatch({
        type: "settle-play",
        id: id.current,
        activity: "sea",
        bonus: elapsed.current <= 90,
      });
      setHint("보물 3개 발견! ⭐ " + (elapsed.current <= 90 ? 50 : 40) + " 별코인!");
    }
  }
  const controls = useMovement(true, action),
    direction = useRef(controls.direction);
  direction.current = controls.direction;
  useEffect(() => {
    const observer = new ResizeObserver(([e]) => {
      if (e) setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let raf = 0,
      last = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!document.hidden) {
        elapsed.current += dt;
        const d = direction.current();
        setPos((p) => stepDive(p, d, dt));
        if (elapsed.current % 18 < 0.05 && elapsed.current > 4)
          inkUntil.current = elapsed.current + 2;
        setInk(inkUntil.current > elapsed.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const scale = Math.min(1, size.w / 700),
    viewH = size.h / scale,
    top = Math.max(0, Math.min(DIVE_SIZE.height - viewH, pos.y - viewH * 0.4));
  return (
    <div className="kid-dive" ref={root} role="region" aria-label="세로 잠수함 탐험">
      <div className="kid-dive-entry" aria-hidden="true">
        🫧 잠수 시작! 🫧
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 ${top} 700 ${viewH}`}
        preserveAspectRatio="xMidYMin slice"
        aria-label="육지 없는 깊은 바닷속"
      >
        <defs>
          <linearGradient id="kid-depth" x2="0" y2="1">
            <stop stopColor="#36c2dc" />
            <stop offset=".4" stopColor="#146caa" />
            <stop offset="1" stopColor="#071f49" />
          </linearGradient>
          <radialGradient id="kid-beam">
            <stop stopColor="#fffbc2" stopOpacity=".4" />
            <stop offset="1" stopColor="#fffbc2" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="700" height="3300" fill="url(#kid-depth)" />
        <path d="M0 20Q150 50 350 20T700 20" fill="none" stroke="#d8ffff" strokeWidth="12" />
        {[250, 1100, 2250].map((y, i) => (
          <g key={y}>
            <text x="40" y={y} fill="#c9f7ff" fontSize="26">
              {["햇살 바다", "산호초 정원", "깊은 보물 동굴"][i]}
            </text>
            {Array.from({ length: 7 }, (_, j) => (
              <g key={j} transform={`translate(${45 + j * 95} ${y + 240 + (j % 2) * 100})`}>
                <path
                  d="M0 80Q-40 10-25-60M0 80Q40 10 35-70M0 80V-40"
                  fill="none"
                  stroke={i === 2 ? "#7971ba" : j % 2 ? "#f29fb2" : "#61d3ba"}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        ))}
        {Array.from({ length: 30 }, (_, i) => (
          <g key={i} transform={`translate(${80 + ((i * 127) % 540)} ${240 + i * 92})`}>
            <ellipse rx="21" ry="11" fill={["#ffc369", "#eb9ad5", "#88e1d5"][i % 3]} />
            <path d="M20 0L38-13V13Z" fill="#fbd68e" />
            <circle cx="-10" cy="-3" r="3" fill="#173e5c" />
            {!reduced && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${80 + ((i * 127) % 540)} ${240 + i * 92};${110 + ((i * 127) % 540)} ${240 + i * 92};${80 + ((i * 127) % 540)} ${240 + i * 92}`}
                dur={`${4 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            )}
          </g>
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <circle
            key={i}
            cx={30 + ((i * 173) % 650)}
            cy={80 + i * 114}
            r={4 + (i % 5)}
            fill="none"
            stroke="#b5f4fa66"
            strokeWidth="2"
          />
        ))}
        <path
          d="M0 2600Q90 2480 140 2720L70 3300H0ZM700 2450Q530 2540 600 2780L700 3300Z"
          fill="#20325c"
        />
        {DIVE_TREASURES.map((t) => (
          <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
            <circle
              r="48"
              fill={found.includes(t.id) ? "#67d7b0" : "#ffe295"}
              stroke="#fff8d9"
              strokeWidth="5"
            />
            <text textAnchor="middle" y="12" fontSize="36">
              {found.includes(t.id) ? "✓" : "💎"}
            </text>
            <text textAnchor="middle" y="-65" fill="white" fontSize="23">
              {t.name}
            </text>
          </g>
        ))}
        <g transform={`translate(${pos.x} ${pos.y})`} data-testid="submarine">
          <ellipse cx="95" rx="180" ry="110" fill="url(#kid-beam)" />
          <path d="M-86-20L-125-55V35L-86 15" fill="#f4b34c" />
          <rect
            x="-100"
            y="-60"
            width="210"
            height="100"
            rx="50"
            fill="#ffc95e"
            stroke="#fff2bd"
            strokeWidth="7"
          />
          <path d="M10-62V-110H60" stroke="#e9ad43" strokeWidth="16" fill="none" />
          <circle cx="-28" cy="-15" r="34" fill="#a4e8f0" stroke="#e6a54b" strokeWidth="7" />
          <image
            x="-53"
            y="-51"
            width="50"
            height="67"
            href={characterUrl(state.outfit, "idle", false, reduced, identity.id)}
          />
          <circle cx="53" cy="-15" r="30" fill="#a4e8f0" stroke="#e6a54b" strokeWidth="7" />
          {state.companions[0] === "dad" ? (
            <g transform="translate(35 -43) scale(.32)">
              <DadArt />
            </g>
          ) : state.companions[0] === "robot" ? (
            <g transform="translate(35 -43) scale(.32)">
              <RobotArt />
            </g>
          ) : state.companions.length > 0 ? (
            <g transform="translate(33 -43) scale(.45)">
              <FriendArt index={2} />
            </g>
          ) : (
            <text x="53" y="-5" textAnchor="middle" fontSize="24">
              ★
            </text>
          )}
        </g>
      </svg>
      <header className="kid-scene-header">
        <b>
          🐠 {Math.round(pos.y / 10)}m · 💎 {found.length}/3
        </b>
        <button onClick={onClose}>↑ 수면 · 항구로</button>
      </header>
      {ink && <div className="kid-ink" aria-hidden="true" />}
      <div className="kid-play-controls">
        <p role="status">{hint}</p>
        <Joystick onMove={controls.setStick} />
        <button className="kid-action" onClick={action}>
          {ink ? "💦 먹물 씻기" : found.length === 3 ? "보물 모두 발견!" : "집게 · 보물 회수"}
        </button>
      </div>
    </div>
  );
}
