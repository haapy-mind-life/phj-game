import { usePlayerIdentity } from "./useFamilyAccount";
import type { ReturnTypeOfLiving } from "./living-types";
import { ACTORS } from "@/game/world/actors";
import { OUTFITS, FOOD_PRICES, REWARDS } from "@/game/world/world-content";
import { useGame } from "@/lib/game-state";
import { characterUrl } from "@/game/world/character-art";
import type { Activity } from "@/game/play/activities";
import { screenPoint } from "@/game/world/world-space";
import type { Point } from "@/game/world/adventure";
import { useEffect, useRef } from "react";
export function ActivityTargets({
  activity,
  player,
}: {
  activity: Activity | null;
  player: Point;
}) {
  if (!activity || activity.done) return null;
  return (
    <svg className="activity-targets" width="20400" height="10800" aria-hidden="true">
      {activity.items
        .filter((i) => !i.found)
        .map((i) => {
          const p = activity.kind === "home" ? i : screenPoint(i, player);
          return (
            <g key={i.id} transform={`translate(${p.x} ${p.y})`}>
              <circle r="45" fill="#fff7d699" stroke="#fff5cc" strokeWidth="4" />
              <text y="18" fontSize="52" textAnchor="middle">
                {activity.kind === "home"
                  ? "🏐"
                  : activity.kind === "sea"
                    ? "🐚"
                    : i.id % 2
                      ? "🍬"
                      : "🎁"}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
export function LivingPanels({ living }: { living: ReturnTypeOfLiving }) {
  const identity = usePlayerIdentity();
  const { state, dispatch } = useGame();
  const panel = useRef<HTMLDivElement>(null);
  const { blocked, setTalk, setWardrobe, setMenuOpen } = living;
  useEffect(() => {
    if (!blocked) return;
    panel.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTalk(null);
        setWardrobe(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [blocked, setTalk, setWardrobe, setMenuOpen]);
  const actor = ACTORS.find((a) => a.id === living.talk);
  return (
    <>
      {(state.companions.length > 0 || living.restaurant || living.scene === "home") && (
        <details className="living-hud" aria-label="함께하는 친구들">
          <summary>친구 · 옷장 · 놀이</summary>
          {living.restaurant && (
            <>
              <b>{living.restaurant.name}</b>
              <small>
                {living.job
                  ? `손님 ${living.job.delivered}/3 · ${living.job.carrying ? "손님에게 전달" : "카운터에서 받기"}`
                  : "주문은 카운터 · 식사는 식탁에서"}
              </small>
              <button onClick={living.leaveRestaurant}>식당 밖으로</button>
            </>
          )}
          <details className="living-companions">
            <summary>
              {living.aboard ? living.aboard + "에 함께" : "함께"} {state.companions.length}명
            </summary>
            <div>
              {state.companions.map((id) => (
                <button key={id} onClick={() => living.setTalk(id)}>
                  {ACTORS.find((a) => a.id === id)?.name} ✓
                </button>
              ))}
            </div>
          </details>
          {living.scene === "home" && (
            <>
              <button onClick={() => living.setWardrobe(true)}>옷장 · 의상 가게</button>
              <button
                onClick={() => living.start("home", living.player)}
                disabled={!!living.activity}
              >
                아빠·친구와 공놀이
              </button>
              <small>
                집 손님 {state.guests.length}/4 · 같이 가기 {state.companions.length}/4
              </small>
            </>
          )}
        </details>
      )}
      {living.activity && (
        <div className="living-activity-hud" role="status">
          <b>
            {living.activity.kind === "home"
              ? "🏐 함께 공놀이"
              : living.activity.kind === "sea"
                ? "🦑 먹물 피하기"
                : "🎃 할로윈 축제"}
          </b>
          <span>
            {living.activity.score}/5 · {Math.ceil(living.activity.time)}초 · 친구 도움{" "}
            {living.activity.helped}/2
          </span>
          {living.activity.ink > 0 && (
            <button onClick={() => living.setActivity((a) => (a ? { ...a, ink: 0 } : a))}>
              물로 먹물 씻기
            </button>
          )}
          {living.activity.done && (
            <strong>
              {living.activity.won
                ? `성공! +${REWARDS[living.activity.kind]} 별코인`
                : "다시 도전해 봐!"}
            </strong>
          )}
          <button onClick={() => living.setActivity(null)}>
            {living.activity.done ? "놀이 마치기" : "놀이 그만하기"}
          </button>
        </div>
      )}
      {living.blocked && (
        <div className="living-backdrop">
          <div
            className="living-panel"
            role="dialog"
            aria-modal="true"
            aria-label={actor ? "친구와 대화" : living.wardrobe ? "의상 가게" : "메뉴와 아르바이트"}
            tabIndex={-1}
            ref={panel}
          >
            <button
              className="living-close"
              onClick={() => {
                living.setTalk(null);
                living.setWardrobe(false);
                living.setMenuOpen(false);
              }}
            >
              닫기 ✕
            </button>
            {actor && (
              <>
                <h2>{actor.name}</h2>
                <p>우리 어디에서 같이 놀까?</p>
                <div className="living-options">
                  <button
                    onClick={() => living.social("follow")}
                    disabled={!state.companions.includes(actor.id) && state.companions.length >= 4}
                  >
                    같이 가자 ({state.companions.length}/4)
                  </button>
                  <button
                    onClick={() => living.social("invite")}
                    disabled={!state.guests.includes(actor.id) && state.guests.length >= 4}
                  >
                    우리 집에 초대 ({state.guests.length}/4)
                  </button>
                  <button onClick={() => living.social("leave")}>다음에 또 놀자</button>
                </div>
              </>
            )}
            {living.menuOpen && living.restaurant && (
              <>
                <h2>{living.restaurant.name} 메뉴</h2>
                <p>{state.money} 별코인 · 음식은 식탁에서 먹어요.</p>
                <div className="living-shop">
                  {living.restaurant.menu.map((name, i) => (
                    <button
                      key={name}
                      disabled={state.money < FOOD_PRICES[i]! || living.meal !== null}
                      onClick={() => living.buyMeal(i)}
                    >
                      <span>{living.restaurant!.emoji[i]}</span>
                      {name}
                      <small>{FOOD_PRICES[i]} 별코인</small>
                    </button>
                  ))}
                </div>
                <button className="living-primary" onClick={living.startJob}>
                  손님 세 명에게 음식 전달 · 45 별코인 벌기
                </button>
              </>
            )}
            {living.wardrobe && (
              <>
                <h2>{identity.name}의 옷장</h2>
                <p>{state.money} 별코인 · 마음에 드는 옷을 입어 봐!</p>
                <div className="living-shop">
                  {(["mint", "peach", "lavender"] as const).map((id) => (
                    <button
                      key={id}
                      aria-pressed={state.outfit === id}
                      onClick={() => dispatch({ type: "outfit", outfit: id })}
                    >
                      <img src={characterUrl(id, "idle", false, false, identity.id)} alt="" />
                      {id === "mint" ? "민트 토끼" : id === "peach" ? "복숭아 토끼" : "보라 토끼"}
                      <small>가지고 있어요</small>
                    </button>
                  ))}
                  {OUTFITS.map((o) => {
                    const owned = state.ownedOutfits.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        aria-pressed={state.outfit === o.id}
                        disabled={!owned && state.money < o.cost}
                        onClick={() =>
                          dispatch(
                            owned
                              ? { type: "outfit", outfit: o.id }
                              : { type: "buy-outfit", id: o.id },
                          )
                        }
                      >
                        <img src={characterUrl(o.id, "idle", false, false, identity.id)} alt="" />
                        {o.name}
                        <small>{owned ? "입기" : `${o.cost} 별코인`}</small>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
