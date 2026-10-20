import { usePlayerIdentity } from "./useFamilyAccount";
import { ACTORS } from "@/game/actors";
import { PersonArt } from "./People";
import { useEffect, useRef, useState } from "react";
import { actMini, newMini, stepMini, type MiniKind } from "@/game/adventure";
import { characterUrl } from "@/game/character-art";
import { useGame } from "@/lib/game-state";
import { useMovement } from "./useMovement";
import { Joystick } from "./Joystick";
const INFO = {
  treasure: {
    name: "토토의 보물찾기",
    rule: "숲을 걸어 다니며 반짝이는 보물 6개를 찾아봐. 75초 안에 모두 모으면 성공!",
    goal: 6,
  },
  stars: {
    name: "루루의 별빛 공원",
    rule: "공원에 나타나는 별을 모아봐! 6개를 모으면 새로운 별이 나타나. 45초 동안 18개에 도전!",
    goal: 18,
  },
  fishing: {
    name: "호숫가 낚시",
    rule: "찌가 초록색 구간에 들어오면 낚기 버튼을 톡! 45초 안에 5마리를 만나봐.",
    goal: 5,
  },
};
export function MiniGame({ kind, onClose }: { kind: MiniKind; onClose: () => void }) {
  const identity = usePlayerIdentity();
  const { state, dispatch, getState } = useGame();
  const game = useRef(newMini(kind));
  const id = useRef("");
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [, render] = useState(0);
  const [reward, setReward] = useState<number | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const action = () => {
    if (started && !paused) actMini(game.current);
  };
  const movement = useMovement(started && !paused && game.current.phase === "playing", action);
  const directionRef = useRef(movement.direction);
  directionRef.current = movement.direction;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const pause = () => setPaused(true);
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaused(true);
      if (e.key === "Tab") {
        const buttons =
          dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) return;
        const first = buttons[0]!,
          last = buttons[buttons.length - 1]!;
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === dialog.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === dialog.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("keydown", keys);
      prev?.focus();
    };
  }, []);
  useEffect(() => {
    if (!started || paused) return;
    let raf = 0,
      last = 0;
    const loop = (now: number) => {
      stepMini(
        game.current,
        directionRef.current(),
        last ? (now - last) / 1000 : 0,
        state.companions.length,
      );
      last = now;
      render((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, paused, state.companions.length]);
  const g = game.current;
  useEffect(() => {
    if (!started || g.phase === "playing" || reward !== null) return;
    const before = getState().money;
    const after = dispatch({ type: "settle-mini", id: id.current, game: kind, score: g.score });
    if (g.phase === "won" && kind !== "fishing")
      dispatch({ type: "friend-play", id: kind === "treasure" ? "toto" : "lulu" });
    setReward(after.money - before);
  }, [g.phase, g.score, started, reward, dispatch, getState, kind]);
  const start = () => {
    game.current = newMini(kind);
    id.current = `mini-${crypto.randomUUID()}`;
    setReward(null);
    setPaused(false);
    setStarted(true);
  };
  const info = INFO[kind];
  return (
    <div className="adv-modal">
      <div
        className="adv-game"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-title"
        tabIndex={-1}
        ref={dialog}
      >
        <header>
          <div>
            <small>친구와 함께 놀자</small>
            <h2 id="mini-title">{info.name}</h2>
          </div>
          <button onClick={onClose}>월드로 돌아가기</button>
        </header>
        <p>{info.rule}</p>
        <div className="adv-game-hud">
          <b>
            {g.score} / {info.goal}
          </b>
          <span>남은 시간 {Math.ceil(g.time)}초</span>
          <span>최고 {state.miniBest[kind]}</span>
          {state.companions.length > 0 && (
            <span>
              함께 {state.companions.length}명 · 친구 도움 {g.assisted}/2
            </span>
          )}
          {started && g.phase === "playing" && (
            <button onClick={() => setPaused((p) => !p)}>
              {paused ? "계속하기" : "잠깐 쉬기"}
            </button>
          )}
        </div>
        <div className={`adv-arena ${kind}`}>
          <svg viewBox="0 0 760 420" aria-label={`${info.name} 놀이 화면`}>
            <rect
              width="760"
              height="420"
              rx="24"
              fill={kind === "fishing" ? "#b9e5ed" : kind === "stars" ? "#d7e5ed" : "#dcebc8"}
            />
            <path
              d="M0 370Q250 200 400 370T800 360"
              fill="none"
              stroke="#f5e8c9"
              strokeWidth="75"
            />
            {[45, 195, 540, 690].map((x, i) => (
              <g key={x} transform={`translate(${x} ${i % 2 ? 50 : 175})`}>
                <rect x="-6" y="10" width="12" height="45" rx="5" fill="#bc9576" />
                <circle cy="-6" r="32" fill={kind === "stars" ? "#a6c6b9" : "#9fc286"} />
                <circle cx="-17" cy="8" r="22" fill="#b4cf98" />
              </g>
            ))}
            {kind !== "fishing" &&
              g.items
                .filter((i) => !i.found)
                .map((item, i) => (
                  <g key={i} transform={`translate(${item.x} ${item.y})`}>
                    <circle r="25" fill="#fff8dc99" />
                    <text textAnchor="middle" y="10" fontSize="30">
                      {kind === "stars" ? "★" : "🎁"}
                    </text>
                  </g>
                ))}
            {kind !== "fishing" && state.companions.length > 0 && (
              <g transform={`translate(${g.helper.x - 25} ${g.helper.y - 65}) scale(.55)`}>
                <PersonArt
                  actor={ACTORS.find((a) => a.id === state.companions[0])!}
                  moving={g.helperTarget !== null}
                />
              </g>
            )}
            {kind === "fishing" ? (
              <>
                <ellipse cx="380" cy="215" rx="285" ry="110" fill="#83c9dc" />
                <path d="M125 340 240 200 375 230" fill="none" stroke="#a78969" strokeWidth="5" />
                <circle cx="375" cy="230" r="8" fill="#f18e88" />
                <text x="500" y="230" fontSize="44">
                  🐟
                </text>
                <image
                  href={characterUrl(state.outfit, "idle", false, false, identity.id)}
                  x="65"
                  y="275"
                  width="75"
                  height="90"
                />
              </>
            ) : (
              <image
                href={characterUrl(state.outfit, "idle", false, false, identity.id)}
                x={g.player.x - 30}
                y={g.player.y - 65}
                width="60"
                height="73"
              />
            )}
          </svg>
          {kind === "fishing" && (
            <div className="adv-fishing-meter" aria-label="초록색 구간에서 낚기">
              <span />
              <i style={{ left: `${g.cursor * 100}%` }} />
            </div>
          )}
          {!started ? (
            <div className="adv-overlay">
              <b>준비됐어?</b>
              <button onClick={start}>놀이 시작!</button>
            </div>
          ) : g.phase !== "playing" ? (
            <div className="adv-overlay">
              <b>{g.phase === "won" ? "멋지다! 성공!" : "즐거운 모험이었어!"}</b>
              <span>
                {g.score}개 · 별코인 +{reward ?? 0}
              </span>
              <button onClick={start}>한 번 더!</button>
              <button onClick={onClose}>월드로 돌아가기</button>
            </div>
          ) : paused ? (
            <div className="adv-overlay">
              <b>잠깐 쉬는 중</b>
              <button onClick={() => setPaused(false)}>계속하기</button>
            </div>
          ) : null}
        </div>
        <p role="status">{g.feedback}</p>
        {started &&
          !paused &&
          g.phase === "playing" &&
          (kind === "fishing" ? (
            <button className="adv-primary" onClick={action}>
              낚기!
            </button>
          ) : (
            <div className="adv-mini-controls">
              <Joystick onMove={movement.setStick} />
              <button className="adv-interact" onClick={() => setPaused(true)}>
                잠깐 쉬기
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
