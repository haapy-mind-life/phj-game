import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  createPeanuts,
  peanutOrder,
  PEANUT_GOAL,
  tapPeanut,
  tickPeanuts,
} from "@/game/peanut-engine";
import { useGame } from "@/lib/game-state";
import { Shell } from "./Shell";
import "./peanuts.css";

const NAMES = ["왼쪽", "가운데", "오른쪽"] as const;
export function PeanutGame() {
  const { state, ready, dispatch, getState } = useGame();
  const [game, setGame] = useState(createPeanuts);
  const [reward, setReward] = useState<number | null>(null);
  const session = useRef("");
  const paid = useRef("");
  useEffect(() => {
    const pause = () => setGame((g) => (g.phase === "playing" ? { ...g, phase: "paused" } : g));
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (game.phase !== "playing") return;
    let frame = 0,
      last = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      setGame((g) => tickPeanuts(g, elapsed));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [game.phase]);
  useEffect(() => {
    if (
      (game.phase !== "won" && game.phase !== "lost") ||
      !session.current ||
      paid.current === session.current
    )
      return;
    const before = getState().money;
    const after = dispatch({
      type: "settle-mini",
      game: "peanuts",
      id: session.current,
      score: game.score,
    });
    paid.current = session.current;
    setReward(after.money - before);
  }, [game.phase, game.score, dispatch, getState]);
  const start = () => {
    session.current = `peanuts-${crypto.randomUUID()}`;
    setReward(null);
    setGame({ ...createPeanuts(), phase: "playing" });
  };
  const active = game.phase === "playing";
  const finished = game.phase === "won" || game.phase === "lost";
  return (
    <Shell
      active="mini"
      title="박현준 땅콩 톡톡"
      subtitle="그림 순서를 보고 껍질을 톡톡! 8개의 땅콩을 꺼내 봐요."
    >
      <section
        className="peanut-game"
        aria-label="땅콩 순서 놀이"
        data-phase={game.phase}
        data-score={game.score}
        data-remaining={game.remaining}
        data-step={game.step}
        data-order={peanutOrder(game).join(",")}
        data-mistakes={game.mistakes}
      >
        <div className="peanut-hud">
          <span>
            🥜 {game.score}/{PEANUT_GOAL}개
          </span>
          <span>⏳ {Math.ceil(game.remaining)}초</span>
          <span>실수 {game.mistakes}/3</span>
        </div>
        <div className="peanut-basket" aria-label={`꺼낸 땅콩 ${game.score}개`}>
          {Array.from({ length: PEANUT_GOAL }, (_, i) => (
            <span key={i} aria-hidden="true">
              {i < game.score ? "🥜" : "○"}
            </span>
          ))}
        </div>
        <p className="peanut-record">내 최고 기록 {state.miniBest.peanuts}개</p>
        {game.phase === "ready" ? (
          <div className="peanut-intro">
            <div aria-hidden="true" className="peanut-picture">
              🥜
            </div>
            <h2>껍질을 순서대로 깨요</h2>
            <p>
              왼쪽·가운데·오른쪽을 그림 순서대로 눌러요.
              <br />
              틀리면 그 땅콩의 처음부터! 3번 틀리거나
              <br />
              60초가 지나면 쉬었다 다시 도전해요.
            </p>
            <p>
              도중에 나가면 이번 보상은 받지 않아요.
              <br />
              끝낸 놀이의 땅콩 수만큼 별코인을 받아요.
            </p>
            <button className="hj-big" disabled={!ready} onClick={start}>
              땅콩 놀이 시작
            </button>
          </div>
        ) : (
          <>
            {!finished && (
              <>
                <h2>이 순서대로 톡!</h2>
                <ol className="peanut-order" aria-label="껍질 깨는 순서">
                  {peanutOrder(game).map((spot, i) => (
                    <li
                      key={i}
                      aria-current={i === game.step ? "step" : undefined}
                      className={i < game.step ? "done" : ""}
                    >
                      <span>{i < game.step ? "✓" : i + 1}</span>
                      {NAMES[spot]}
                    </li>
                  ))}
                </ol>
                <div className="peanut-shell" aria-label="땅콩 껍질">
                  {NAMES.map((name, spot) => (
                    <button
                      key={name}
                      disabled={!active}
                      data-spot={spot}
                      data-cracked={peanutOrder(game)
                        .slice(0, game.step)
                        .includes(spot as 0 | 1 | 2)}
                      onClick={() => setGame((g) => tapPeanut(g, spot as 0 | 1 | 2))}
                    >
                      <span aria-hidden="true">{spot === 0 ? "◀" : spot === 1 ? "●" : "▶"}</span>
                      {name}
                    </button>
                  ))}
                </div>
                <p role="status" className="peanut-feedback">
                  {game.mistakes > 0 && game.step === 0
                    ? "괜찮아! 순서를 보고 다시 눌러 봐요."
                    : `${game.step}조각 깼어요. 다음 순서를 눌러 봐요!`}
                </p>
              </>
            )}
            {active && (
              <button
                className="hj-big"
                onClick={() => setGame((g) => ({ ...g, phase: "paused" }))}
              >
                잠깐 쉬기
              </button>
            )}
            {game.phase === "paused" && (
              <div className="peanut-result">
                <h2>잠깐 쉬는 중</h2>
                <p>시간도 함께 쉬어요.</p>
                <button
                  className="hj-big"
                  onClick={() => setGame((g) => ({ ...g, phase: "playing" }))}
                >
                  이어서 깨기
                </button>
              </div>
            )}
            {finished && (
              <div className="peanut-result" role="status">
                <h2>{game.phase === "won" ? "땅콩 8개 완성!" : "오늘도 멋진 도전!"}</h2>
                <p>
                  {game.score}개를 꺼냈어요. 별코인 {reward ?? "…"}개를 받았어요.
                </p>
                <button className="hj-big" onClick={start}>
                  한 번 더 도전
                </button>
              </div>
            )}
          </>
        )}
        <Link to="/kart" className="peanut-return">
          카트로 돌아가기
        </Link>
      </section>
    </Shell>
  );
}
