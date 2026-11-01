import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { KART_GAMES } from "@/game/kart-catalog";
import { useGame } from "@/lib/game-state";
import "./kart.css";

const FILTERS = ["전체", "큰 게임", "미니게임", "러너", "대결"] as const;
export function KartHub() {
  const { state, ready, storageWarning } = useGame();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");
  const list = useRef<HTMLUListElement>(null);
  const games = KART_GAMES.filter((game) =>
    filter === "전체"
      ? true
      : filter === "큰 게임"
        ? game.kind === "large"
        : filter === "미니게임"
          ? game.kind === "mini"
          : game.genre.includes(filter),
  );
  return (
    <main className="kart-hub">
      <header className="kart-header">
        <span className="kart-eyebrow">오늘은 무슨 모험을 할까?</span>
        <h1>박현준 카트</h1>
        <p>⭐ {ready ? state.money.toLocaleString("ko-KR") : "…"} 별코인</p>
      </header>
      {storageWarning && <p role="status">지금은 저장이 잠깐 안 돼요. 놀이는 계속할 수 있어요.</p>}
      <nav className="kart-start" aria-label="바로 시작">
        <Link to="/" className="kart-world">
          <span aria-hidden="true">🌍</span>
          <strong>박현준 게임</strong>
          <small>마을과 바다로 출발!</small>
        </Link>
        <Link to="/race" className="kart-run">
          <span aria-hidden="true">🚀</span>
          <strong>박현준 러너</strong>
          <small>톡 눌러 폴짝 달리기!</small>
        </Link>
      </nav>
      <section aria-labelledby="kart-list-title">
        <h2 id="kart-list-title">다음 모험 둘러보기</h2>
        <p>
          큰 게임 20개 · 미니게임 20개를 꿈꾸고 있어요.
          <br />
          준비 중인 놀이는 아직 시작할 수 없어요.
        </p>
        <div className="kart-filters" role="group" aria-label="게임 종류">
          {FILTERS.map((name) => (
            <button
              key={name}
              aria-pressed={filter === name}
              onClick={() => {
                setFilter(name);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="kart-list-tools">
          <p role="status">
            {filter} · {games.length}개
          </p>
          <div>
            <button
              aria-label="앞쪽 게임 보기"
              onClick={() => list.current?.scrollBy({ left: -290, behavior: "smooth" })}
            >
              ←
            </button>
            <button
              aria-label="뒤쪽 게임 보기"
              onClick={() => list.current?.scrollBy({ left: 290, behavior: "smooth" })}
            >
              →
            </button>
          </div>
        </div>
        <ul key={filter} className="kart-list" ref={list} aria-label="게임 목록" tabIndex={0}>
          {games.map((game) => (
            <li
              key={game.id}
              className="kart-card"
              data-game-id={game.id}
              data-status={game.status}
            >
              <span className={`kart-badge kart-${game.status}`}>
                {game.status === "playable"
                  ? "플레이 가능"
                  : game.status === "existing"
                    ? "기존 기능 연결"
                    : "준비 중"}
              </span>
              <small>
                {game.kind === "large" ? "큰 게임" : "미니게임"} · {game.genre}
              </small>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              {"route" in game ? (
                <Link to={game.route}>
                  {game.status === "existing" ? "기존 놀이 열기" : "시작하기"}
                  <span className="sr-only"> · {game.name}</span>
                </Link>
              ) : (
                <span className="kart-wait">새 모험을 준비하고 있어요</span>
              )}
            </li>
          ))}
        </ul>
        <p className="kart-tip">손가락으로 옆으로 넘기거나 화살표를 눌러 봐!</p>
      </section>
      <footer>
        <Link to="/">마을로 돌아가기</Link>
      </footer>
    </main>
  );
}
