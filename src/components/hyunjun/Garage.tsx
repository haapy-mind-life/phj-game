import { useGame } from "@/lib/game-state";
import { PREMIUM_CARS } from "@/game/world-content";
import { useState } from "react";
import { CARS, carById } from "@/game/cars";
import { CarArt } from "./CarArt";
const KEY = "hyunjun-selected-car-v1";
export function loadCarId() {
  if (typeof window === "undefined") return CARS[0]!.id;
  try {
    return carById(window.localStorage.getItem(KEY) ?? "").id;
  } catch {
    return CARS[0]!.id;
  }
}
export function Garage({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const { state, dispatch } = useGame();
  const pages = Math.ceil(CARS.length / 20);
  return (
    <div className="hj-garage-backdrop" role="presentation">
      <section className="hj-garage" role="dialog" aria-modal="true" aria-label="자동차 126종 차고">
        <header>
          <div>
            <h2>현준이의 자동차 차고</h2>
            <p>{CARS.length}대 중 마음에 드는 차를 골라 운전해 보자!</p>
          </div>
          <button onClick={onClose}>닫기 ✕</button>
        </header>
        <p role="status">
          선택한 자동차: {carById(selected).name} · {selected.replace("car-", "")}번
        </p>
        <div className="hj-garage-grid">
          {CARS.slice(page * 20, page * 20 + 20).map((car) => (
            <button
              key={car.id}
              className={selected === car.id ? "chosen" : ""}
              aria-pressed={selected === car.id}
              disabled={
                !state.ownedCars.includes(car.id) &&
                state.money < (PREMIUM_CARS.find((c) => c.id === car.id)?.cost ?? 0)
              }
              onClick={() => {
                if (!state.ownedCars.includes(car.id)) {
                  const next = dispatch({ type: "buy-car", id: car.id });
                  if (!next.ownedCars.includes(car.id)) return;
                }
                onSelect(car.id);
              }}
            >
              <CarArt car={car} size={85} />
              <span>{car.name}</span>
              <small>
                {state.ownedCars.includes(car.id)
                  ? "가지고 있어요"
                  : `${PREMIUM_CARS.find((c) => c.id === car.id)?.cost} 별코인 · 특별 도색`}
              </small>
            </button>
          ))}
        </div>
        <footer>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ◀ 이전 20대
          </button>
          <strong>
            {page + 1} / {pages}
          </strong>
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
          >
            다음 20대 ▶
          </button>
          <button className="hj-drive-now" onClick={onClose}>
            이 차 타고 출발!
          </button>
        </footer>
      </section>
    </div>
  );
}
export function saveCarId(id: string) {
  try {
    window.localStorage.setItem(KEY, carById(id).id);
  } catch {
    /* session-only selection */
  }
}
