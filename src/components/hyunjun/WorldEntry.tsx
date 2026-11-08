// The world screen's code loads on demand, but its styles stay in the main
// stylesheet in the same order as before, so no other screen changes look.
import "./robot-fusion.css";
import { CARS } from "@/game/economy/cars";
import { CarArt } from "./CarArt";
import { PlayerAvatar } from "./PlayerAvatar";
import { RobotRosterArt } from "./RobotRosterArt";
import { useReducedMotion } from "./useReducedMotion";
import { useWorldEntry } from "./useWorldEntry";
import "./robot-giant.css";
import "./kart.css";
import "./adventure.css";
import "./world-entry.css";

// Copy kept in one place. The title reuses the shipped "박현준 게임" brand;
// the longer "뭐든지 다 있는 박현준 월드" title waits for the guardian's decision.
const COPY = {
  title: "박현준 게임",
  tagline: "뭐든지 다 있는 월드",
  start: "게임 시작하겠습니다!",
  loading: "박현준 월드로 가는 중...",
  failed: "길이 잠깐 막혔어요",
  retry: "다시 가기",
};

function Scene() {
  return (
    <div className="we-scene" aria-hidden="true">
      <div className="we-sun" />
      <div className="we-cloud one" />
      <div className="we-cloud two" />
      <svg className="we-coaster" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0 110 C60 110 70 20 130 20 S200 100 250 80 S320 10 400 40" />
        <path className="rail" d="M0 110 C60 110 70 20 130 20 S200 100 250 80 S320 10 400 40" />
      </svg>
      <div className="we-hill left" />
      <div className="we-hill right" />
      <div className="we-sea">
        <span>⛵</span>
        <span>🐟</span>
      </div>
      <div className="we-places">
        <span>🏠</span>
        <span>🏃</span>
        <span>🎢</span>
      </div>
    </div>
  );
}

function Cast({ moving }: { moving: boolean }) {
  return (
    <div className="we-cast" aria-hidden="true">
      <div className="we-car">
        <CarArt car={CARS[0]!} size={120} />
      </div>
      <PlayerAvatar width={110} height={146} moving={moving} className="we-hero" />
      <div className="we-robot">
        <RobotRosterArt id="rb-thunder-police" size={92} label="번개 경찰 로봇" />
      </div>
    </div>
  );
}

/** The root route: title → loading → the existing world (Village), unchanged. */
export function WorldEntry() {
  const { phase, start, retry, World } = useWorldEntry();
  const reduced = useReducedMotion();
  if (World) return <World />;
  return (
    <main className="we-screen" data-entry-phase={phase}>
      <Scene />
      <div className="we-content">
        <header className="we-title">
          <small>{COPY.tagline}</small>
          <h1>{COPY.title}</h1>
        </header>
        <Cast moving={phase === "loading" && !reduced} />
        {phase === "title" && (
          <button type="button" className="we-start" onClick={start}>
            {COPY.start}
          </button>
        )}
        {phase === "loading" && (
          <div className="we-loading" role="status" aria-live="polite">
            <span className="we-spinner" aria-hidden="true" />
            <b>{COPY.loading}</b>
          </div>
        )}
        {phase === "failed" && (
          <div className="we-failed" role="alert">
            <b>{COPY.failed}</b>
            <button type="button" className="we-start" onClick={retry}>
              {COPY.retry}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
