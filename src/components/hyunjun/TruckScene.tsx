import { usePlayerIdentity } from "./useFamilyAccount";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";
import {
  RECIPES,
  INGREDIENTS,
  newTruck,
  chooseIngredient,
  cookTruck,
  serveTruck,
} from "@/game/play/truck-play";
import { PlayerAvatar } from "./PlayerAvatar";
import { FriendArt } from "./FriendArt";
import { Joystick } from "./Joystick";
import { useMovement } from "./useMovement";
export function TruckScene({ onClose }: { onClose: () => void }) {
  const identity = usePlayerIdentity();
  const { state, dispatch } = useGame(),
    owned = state.ownedCars.includes("car-101"),
    capacity = state.carUpgrades["car-101"]?.special ? 2 : 1;
  const [game, setGame] = useState(newTruck),
    [pos, setPos] = useState({ x: 350, y: 420 }),
    [seconds, setSeconds] = useState(0),
    [hint, setHint] = useState("재료 두 개를 골라 요리하고 손님에게 가져다줘!");
  const current = useRef(game);
  current.current = game;
  const id = useRef(crypto.randomUUID());
  const elapsed = useRef(0);
  const servedAt = useRef<number[]>([]);
  const nearKitchen = Math.hypot(pos.x - 350, pos.y - 420) < 125,
    nearCustomer = Math.hypot(pos.x - 565, pos.y - 530) < 115;
  const recipe = RECIPES[game.served + game.ready.length];
  function cook() {
    if (!nearKitchen) {
      setHint("트럭 조리대로 이동해 봐!");
      return;
    }
    const next = cookTruck(current.current, capacity);
    current.current = next;
    setGame(next);
    setHint(
      next === game
        ? "그림에 맞는 재료 두 개가 필요해!"
        : "요리 완성! 손님 앞으로 이동해 전달하자.",
    );
  }
  function serve() {
    const prev = current.current,
      next = serveTruck(prev, nearCustomer);
    if (next === prev) {
      setHint("요리를 준비한 뒤 맨 앞 손님에게 가까이 가 봐!");
      return;
    }
    servedAt.current[prev.served] = elapsed.current;
    current.current = next;
    setGame(next);
    dispatch({
      type: "settle-play",
      id: id.current + "-sale-" + prev.served,
      activity: "truck-sale",
      bonus: false,
    });
    setHint("냠냠! 손님이 좋아해. +10 별코인");
    if (next.served === 3) {
      dispatch({
        type: "settle-play",
        id: id.current + "-complete",
        activity: "truck-complete",
        bonus: elapsed.current <= 90,
      });
      setHint("손님 세 명 모두 행복해! ⭐ 장사 성공!");
    }
  }
  function action() {
    if (nearCustomer && current.current.ready.length) serve();
    else cook();
  }
  const controls = useMovement(game.served < 3, action),
    direction = useRef(controls.direction);
  direction.current = controls.direction;
  useEffect(() => {
    let raf = 0,
      last = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!document.hidden) {
        elapsed.current += dt;
        setSeconds(elapsed.current);
        const d = direction.current();
        setPos((p) => ({
          x: Math.max(140, Math.min(610, p.x + d.x * 240 * dt)),
          y: Math.max(385, Math.min(680, p.y + d.y * 240 * dt)),
        }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="kid-truck" role="region" aria-label="움직이는 푸드트럭 장사">
      <svg
        className="kid-truck-world"
        viewBox="0 0 700 850"
        aria-label="판매자와 손님이 있는 해변 푸드트럭"
      >
        <rect width="700" height="850" fill="#f9e3ac" />
        <path d="M625 0Q580 250 650 500T650 850H700V0Z" fill="#7ed8e2" />
        <path d="M640 0Q595 250 665 500T665 850" fill="none" stroke="white" strokeWidth="8" />
        <ellipse cx="340" cy="370" rx="235" ry="30" fill="#bc99553a" />
        <rect
          x="120"
          y="155"
          width="450"
          height="220"
          rx="35"
          fill={owned ? "#f7bf56" : "#ea9b77"}
          stroke="#fff8df"
          strokeWidth="8"
        />
        <rect x="190" y="180" width="280" height="135" rx="14" fill="#fff4d5" />
        <path d="M170 170H490L460 120H200Z" fill="#65b8ac" />
        <g transform="translate(300 310)">
          {owned && nearKitchen ? (
            <PlayerAvatar
              identity={identity.id}
              outfit={state.outfit}
              svg
              width={100}
              height={135}
            />
          ) : !owned ? (
            <g transform="translate(-43 -110)">
              <FriendArt index={4} moving={game.ingredients.length > 0} />
            </g>
          ) : (
            <text y="-30" fontSize="42">
              🍳
            </text>
          )}
        </g>
        <rect x="175" y="295" width="310" height="45" rx="8" fill="#d39a5c" />
        <text x="330" y="329" textAnchor="middle" fontSize="27">
          {game.ingredients.length ? "🥣 ✨" : "🍳  조리대"}
        </text>
        <circle cx="210" cy="375" r="32" fill="#42576a" />
        <circle cx="490" cy="375" r="32" fill="#42576a" />
        <text x="340" y="95" textAnchor="middle" fontSize="31" fill="#684d3e">
          {owned ? `${identity.name}의 냠냠 트럭` : "친구와 함께 장사 연습"}
        </text>
        {[0, 1, 2].map((i) => {
          const served = i < game.served,
            front = i === game.served;
          const x = served
            ? Math.max(-90, 565 - (seconds - (servedAt.current[i] ?? seconds)) * 150)
            : Math.max(565, 900 - seconds * 100) + (i - game.served) * 35;
          const y = served ? 650 : 530 + (i - game.served) * 65;
          return (
            <g key={i} transform={`translate(${x} ${y})`} data-customer={i}>
              <g transform="translate(-48 -140) scale(1.2)">
                <FriendArt index={i + 1} moving={served || seconds < 4} />
              </g>
              {!served && (
                <g>
                  <rect x="-38" y="-205" width="76" height="50" rx="20" fill="white" />
                  <text y="-168" textAnchor="middle" fontSize="32">
                    {RECIPES[i]!.icon}
                  </text>
                  {front && (
                    <text y="25" textAnchor="middle" fontSize="21" fill="#725038">
                      여기서 전달!
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
        {(!owned || !nearKitchen) && (
          <g transform={`translate(${pos.x} ${pos.y})`}>
            <PlayerAvatar
              identity={identity.id}
              outfit={state.outfit}
              svg
              moving={!!(direction.current().x || direction.current().y)}
              width={115}
              height={155}
            />
            {game.ready.length > 0 && (
              <text x="55" y="-75" fontSize="46">
                {RECIPES[game.ready[0]!]!.icon}
              </text>
            )}
            <text y="35" textAnchor="middle" fill="#725038" fontSize="24">
              {identity.name}
              {owned ? "" : " · 요리 도우미"}
            </text>
          </g>
        )}
      </svg>
      <header className="kid-scene-header">
        <b>
          🍔 손님 {game.served}/3 · ⭐ {state.money}
        </b>
        <button onClick={onClose}>{game.served === 3 ? "장사 마치기" : "그만하기"}</button>
      </header>
      {recipe && nearKitchen && game.ready.length < capacity && (
        <div className="kid-recipe">
          <b>
            {recipe.icon} {recipe.name} ·{" "}
            {recipe.ingredients.map((i) => INGREDIENTS.find((x) => x.id === i)?.icon).join(" + ")}
          </b>
          <div>
            {INGREDIENTS.filter(
              (i) =>
                recipe.ingredients.includes(i.id) ||
                i.id === (recipe.ingredients.includes("bread") ? "cheese" : "bread"),
            ).map((i) => (
              <button
                key={i.id}
                aria-label={i.name}
                aria-pressed={game.ingredients.includes(i.id)}
                onClick={() => {
                  const next = chooseIngredient(current.current, i.id);
                  current.current = next;
                  setGame(next);
                  setHint(
                    next === game
                      ? "주문 그림에 있는 재료를 골라 보자!"
                      : "좋아! 재료 " + next.ingredients.length + "/2",
                  );
                }}
              >
                {i.icon}
              </button>
            ))}
            <button onClick={cook}>🍳 요리하기</button>
          </div>
        </div>
      )}
      <div className="kid-play-controls">
        <p role="status">{hint}</p>
        <Joystick onMove={controls.setStick} disabled={game.served === 3} />
        <button className="kid-action" onClick={action} disabled={game.served === 3}>
          {nearCustomer && game.ready.length ? "음식 전달" : "요리하기"}
        </button>
      </div>
    </div>
  );
}
