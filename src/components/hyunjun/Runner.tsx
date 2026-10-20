import { usePlayerIdentity } from "./useFamilyAccount";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceRun,
  createRun,
  HEIGHT,
  STAGE_NAMES,
  tapRun,
  WIDTH,
  type Run,
  type RunMode,
} from "@/game/runner-engine";
import { drawRunner } from "@/game/runner-render";
import { useGame } from "@/lib/game-state";
import { Shell } from "./Shell";

const view = (r: Run) => ({
  phase: r.phase,
  score: Math.floor(r.score),
  coins: r.coins,
  stage: r.stage,
  hint: r.hint,
  activity: r.activity,
  hearts: r.combat.armor,
});

export function Runner() {
  const identity = usePlayerIdentity();
  const identityRef = useRef(identity.id);
  identityRef.current = identity.id;
  const { state, ready, dispatch, getState } = useGame();
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = useRef<Run | null>(null);
  if (!run.current) {
    run.current = createRun("easy");
    run.current.phase = "ready";
  }
  const runId = useRef("");
  const paid = useRef("");
  const [mode, setMode] = useState<RunMode>("easy");
  const [v, setV] = useState(() => view(run.current!));
  const [reward, setReward] = useState(0);
  const outfit = useRef(state.outfit);
  outfit.current = state.outfit;
  const bank = useCallback(
    (show = true) => {
      if (!runId.current || paid.current === runId.current) return;
      const before = getState();
      const current = run.current!;
      const after = dispatch({
        type: "settle-run",
        id: runId.current,
        score: Math.floor(current.score),
        coins: current.coins,
        clear: current.phase === "clear",
      });
      paid.current = runId.current;
      if (show) setReward(after.money - before.money);
    },
    [dispatch, getState],
  );
  const start = useCallback(() => {
    bank(false);
    run.current = createRun(mode);
    runId.current = `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    paid.current = "";
    setReward(0);
    setV(view(run.current));
  }, [bank, mode]);
  const tap = useCallback(() => {
    if (run.current!.phase === "ready") start();
    else tapRun(run.current!);
  }, [start]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.code === "Space" || event.key.toLowerCase() === "e") &&
        !event.repeat &&
        !(event.target as HTMLElement).closest("button")
      ) {
        event.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [tap]);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0,
      last = 0,
      lastUi = 0;
    const loop = (time: number) => {
      const current = run.current!;
      advanceRun(current, last ? (time - last) / 1000 : 0);
      last = time;
      drawRunner(ctx, current, outfit.current, identityRef.current);
      if (time - lastUi > 90) {
        setV(view(current));
        lastUi = time;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const visibility = () => {
      if (document.hidden && run.current!.phase === "running") {
        run.current!.phase = "paused";
        run.current!.accumulator = 0;
        setV(view(run.current!));
      }
      last = 0;
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (v.phase === "clear" || v.phase === "over") bank();
  }, [v.phase, bank]);
  useEffect(() => () => bank(false), [bank]);
  const resume = () => {
    if (run.current!.phase === "paused") {
      run.current!.phase = "running";
      run.current!.accumulator = 0;
      setV(view(run.current!));
    }
  };
  return (
    <Shell
      active="run"
      title="박현준 러너"
      subtitle="한 손가락으로 폴짝! 산책 모드는 자동으로 많이 도와줘요."
    >
      <div className="hj-mode">
        {(["easy", "challenge"] as RunMode[]).map((m) => (
          <button
            key={m}
            disabled={v.phase === "running" || v.phase === "paused"}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            <b>{m === "easy" ? "산책 모드" : "도전 모드"}</b>
            <span>{m === "easy" ? "도움 켜짐" : "하트 3개"}</span>
          </button>
        ))}
        <p>
          최고 기록 <b>{state.runnerBest}</b> / 1000
        </p>
      </div>
      <section className="hj-run-card">
        <div className="hj-run-hud">
          <span>
            {v.stage}/5 · {STAGE_NAMES[v.stage - 1]}
          </span>
          <span>⭐ {v.coins}</span>
          <span>{mode === "easy" ? "넘어져도 괜찮아!" : `하트 ${v.hearts}`}</span>
        </div>
        <div className="hj-progress">
          <i style={{ width: `${v.score / 10}%` }} />
        </div>
        <button
          className="hj-canvas"
          onPointerDown={(e) => {
            if (e.isPrimary) {
              e.preventDefault();
              tap();
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              tap();
            }
          }}
          aria-label="화면을 눌러 점프"
        >
          <canvas ref={canvas} width={WIDTH} height={HEIGHT} />
          {v.phase === "ready" && <span>톡 눌러서 출발!</span>}
          {v.phase === "paused" && <span>잠깐 쉬는 중</span>}
        </button>
        {v.phase === "paused" ? (
          <button className="hj-big" onClick={resume}>
            이어서 달리기
          </button>
        ) : (
          <button className="hj-big" disabled={!ready} onClick={tap}>
            {v.activity === "crane"
              ? "선물 잡기!"
              : v.activity.includes("ladder")
                ? "사다리 톡!"
                : "폴짝!"}
          </button>
        )}
      </section>
      <p className="hj-message" role="status">
        {v.hint}
      </p>
      {(v.phase === "clear" || v.phase === "over") && (
        <section className="hj-result">
          <h2>{v.phase === "clear" ? "완주 성공!" : "오늘도 멋진 모험!"}</h2>
          <p>
            {v.score}점 · 별코인 {reward}개를 마을에 가져왔어요.
          </p>
          <button className="hj-big" onClick={start}>
            한 번 더 달리기
          </button>
        </section>
      )}
    </Shell>
  );
}
