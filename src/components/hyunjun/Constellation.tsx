import { useEffect, useRef, useState, type PointerEvent } from "react";
import { DOTS, traceNext } from "@/game/play/constellation";
import { useGame } from "@/lib/game-state";
export function Constellation({ onClose }: { onClose: () => void }) {
  const { dispatch, getState, ready } = useGame();
  const [score, setScore] = useState(0);
  const [reward, setReward] = useState(0);
  const progress = useRef(0);
  const paid = useRef(false);
  const drawing = useRef<number | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => old?.focus();
  }, []);
  function visit(point: { x: number; y: number }) {
    if (!ready || paid.current) return;
    const next = traceNext(progress.current, point);
    progress.current = next;
    setScore(next);
    if (next === DOTS.length) {
      paid.current = true;
      const before = getState().money;
      const after = dispatch({
        type: "settle-mini",
        id: `draw-${crypto.randomUUID()}`,
        game: "constellation",
        score: next,
      });
      setReward(after.money - before);
    }
  }
  function point(e: PointerEvent<SVGSVGElement>) {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    visit(p);
  }
  return (
    <div className="adv-modal">
      <div
        className="adv-game"
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const buttons =
              dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
            if (!buttons?.length) return;
            const first = buttons[0],
              last = buttons[buttons.length - 1];
            if (
              e.shiftKey &&
              (document.activeElement === first || document.activeElement === dialog.current)
            ) {
              e.preventDefault();
              last?.focus();
            } else if (
              !e.shiftKey &&
              (document.activeElement === last || document.activeElement === dialog.current)
            ) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <h2 id="draw-title">반짝 별자리 공방</h2>
          <button onClick={onClose}>마을로 돌아가기</button>
        </header>
        <p>
          1번부터 6번까지 별을 이어 봐! 손가락이나 펜으로 그어도 되고, 하나씩 톡 눌러도 돼. 시간
          제한은 없어.
        </p>
        <svg
          className="adv-drawing"
          viewBox="0 0 760 340"
          aria-label="숫자 순서대로 별 잇기"
          onPointerDown={(e) => {
            if (e.button !== 0 || drawing.current !== null) return;
            e.preventDefault();
            drawing.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            point(e);
          }}
          onPointerMove={(e) => {
            if (drawing.current === e.pointerId) point(e);
          }}
          onPointerUp={(e) => {
            if (drawing.current === e.pointerId) {
              point(e);
              drawing.current = null;
            }
          }}
          onPointerCancel={() => {
            drawing.current = null;
          }}
          onLostPointerCapture={() => {
            drawing.current = null;
          }}
        >
          <rect width="760" height="340" rx="24" fill="#273b63" />
          <polyline
            points={DOTS.slice(0, score)
              .map((p) => `${p.x},${p.y}`)
              .join(" ")}
            fill="none"
            stroke="#ffe09a"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {DOTS.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y})`}>
              <circle r="32" fill={i < score ? "#ffe09a" : i === score ? "#ffffff" : "#8795b2"} />
              <text textAnchor="middle" y="9" fontSize="26" fill="#273b63">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <p role="status">
          {score === 6
            ? `별자리 완성! 별코인 +${reward}`
            : `${score}/6개 · 다음은 ${score + 1}번 별이야!`}
        </p>
        {score < 6 ? (
          <button className="adv-primary" disabled={!ready} onClick={() => visit(DOTS[score]!)}>
            {score + 1}번 별 잇기
          </button>
        ) : (
          <button
            className="adv-primary"
            onClick={() => {
              progress.current = 0;
              paid.current = false;
              setScore(0);
              setReward(0);
            }}
          >
            새로 그리기
          </button>
        )}
      </div>
    </div>
  );
}
