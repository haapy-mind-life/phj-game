import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { arcadeInfo, arcadeReward, type ArcadeKey, type Outcome } from "@/game/play/arcade";
import { useGame } from "@/lib/game-state";
import { Shell } from "../Shell";
import "./arcade.css";

/** What a game gives the shared shell: pure engine steps plus its own touch view. */
export type ArcadeDef<G> = {
  key: ArcadeKey;
  subtitle: string;
  intro: ReactNode;
  icon: string;
  create: (seed: number) => G;
  tick: (g: G, dt: number) => G;
  outcome: (g: G) => Outcome;
  score: (g: G) => number;
  /** Short HUD items, e.g. "❤ 2", "⏳ 12초". */
  hud: (g: G) => string[];
  View: (p: { g: G; act: (fn: (g: G) => G) => void; active: boolean }) => ReactNode;
  /** Lets go of any held button. A release while paused is ignored, so resuming calls this. */
  release?: (g: G) => G;
};
type Phase = "ready" | "playing" | "paused" | "done";

/**
 * Ready → playing ⇄ paused → done, the same loop as 땅콩 톡톡: time stops while paused or when
 * the page is hidden, a finished run is paid once per session id, and leaving mid-run pays
 * nothing.
 */
export function ArcadeShell<G>({ def }: { def: ArcadeDef<G> }) {
  const info = arcadeInfo(def.key);
  const { state, ready, dispatch, getState } = useGame();
  const [phase, setPhase] = useState<Phase>("ready");
  const [game, setGame] = useState<G>(() => def.create(1));
  const [reward, setReward] = useState<number | null>(null);
  const session = useRef("");
  const paid = useRef("");
  const outcome = def.outcome(game);
  const score = def.score(game);

  useEffect(() => {
    const pause = () => setPhase((p) => (p === "playing" ? "paused" : p));
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
    if (phase !== "playing") return;
    let frame = 0,
      last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setGame((g) => def.tick(g, dt));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase, def]);
  useEffect(() => {
    // A run can end on the same frame the window blurs; settle it from the pause screen too.
    if ((phase !== "playing" && phase !== "paused") || outcome === "playing") return;
    setPhase("done");
    if (!session.current || paid.current === session.current) return;
    paid.current = session.current;
    const before = getState().money;
    const after = dispatch({ type: "settle-arcade", game: def.key, id: session.current, score });
    setReward(after.money - before);
  }, [phase, outcome, score, def.key, dispatch, getState]);

  const start = () => {
    session.current = `${def.key}-${crypto.randomUUID()}`;
    setReward(null);
    setGame(def.create(Math.floor(Math.random() * 2 ** 31) + 1));
    setPhase("playing");
  };
  const act = (fn: (g: G) => G) => {
    if (phase === "playing") setGame(fn);
  };
  const shownPhase = phase === "done" ? outcome : phase;
  return (
    <Shell active="mini" title={info.name} subtitle={def.subtitle}>
      <section
        className="arcade"
        aria-label={info.name}
        data-game={def.key}
        data-phase={shownPhase}
        data-score={score}
        data-goal={info.goal}
      >
        <div className="arcade-hud">
          <span>
            {def.icon} {score}/{info.goal}
          </span>
          {def.hud(game).map((h) => (
            <span key={h.slice(0, 2)}>{h}</span>
          ))}
        </div>
        <p className="arcade-record">내 최고 기록 {state.arcadeBest[def.key]}</p>
        {phase === "ready" ? (
          <div className="arcade-intro">
            <div aria-hidden="true" className="arcade-picture">
              {def.icon}
            </div>
            {def.intro}
            <p>
              도중에 나가면 이번 보상은 받지 않아요.
              <br />
              끝까지 하면 점수만큼 별코인, 목표를 채우면 보너스!
            </p>
            <button className="hj-big" disabled={!ready} onClick={start}>
              시작하기
            </button>
          </div>
        ) : (
          <>
            {phase !== "done" && <def.View g={game} act={act} active={phase === "playing"} />}
            {phase === "playing" && (
              <button className="hj-big arcade-pause" onClick={() => setPhase("paused")}>
                잠깐 쉬기
              </button>
            )}
            {phase === "paused" && (
              <div className="arcade-result">
                <h2>잠깐 쉬는 중</h2>
                <p>시간도 함께 쉬어요.</p>
                <button
                  className="hj-big"
                  onClick={() => {
                    if (def.release) setGame(def.release);
                    setPhase("playing");
                  }}
                >
                  이어서 하기
                </button>
              </div>
            )}
            {phase === "done" && (
              <div className="arcade-result" role="status">
                <h2>{outcome === "won" ? "목표 달성!" : "오늘도 멋진 도전!"}</h2>
                <p>
                  {score}점이에요. 별코인 {reward ?? arcadeReward(def.key, score)}개를 받았어요.
                </p>
                <button className="hj-big" onClick={start}>
                  한 번 더 도전
                </button>
              </div>
            )}
          </>
        )}
        <Link to="/kart" className="arcade-return">
          카트로 돌아가기
        </Link>
      </section>
    </Shell>
  );
}
