import "./kart.css";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGame } from "@/lib/game-state";
import { Star } from "./Art";

export function Shell({
  title,
  subtitle,
  active,
  children,
  onKart,
  className = "",
  showHomeReturn = true,
}: {
  title: string;
  subtitle: string;
  active: "home" | "run" | "farm" | "room" | "mini";
  children: ReactNode;
  onKart?: () => void;
  className?: string;
  showHomeReturn?: boolean;
}) {
  const { state, ready, storageWarning } = useGame();
  return (
    <main className={`hj-shell${active === "home" ? " kid-world-shell" : ""} ${className}`}>
      <div className="hj-container">
        <header className="hj-topbar">
          <Link to="/" className="hj-brand">
            박현준 게임<small>걸어서 만나는 모험 마을</small>
          </Link>
          <Link to="/kart" className="hj-kart-link" onClick={onKart}>
            카트 열기
          </Link>
          <div className="hj-wallet">
            <Star />
            <strong>{ready ? state.money.toLocaleString("ko-KR") : "…"}</strong>
            <span>별코인</span>
          </div>
        </header>
        <div className="hj-heading">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {storageWarning && (
          <p className="hj-warning" role="status">
            지금은 저장이 잠깐 안 돼요. 놀이는 계속할 수 있어요.
          </p>
        )}
        {children}
        {showHomeReturn && active !== "home" && active !== "mini" && (
          <nav className="hj-home-return" aria-label="마을로 돌아가기">
            <Link to="/">🏡 마을로 돌아가기</Link>
          </nav>
        )}
      </div>
    </main>
  );
}
