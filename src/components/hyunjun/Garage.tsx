import { useGame } from "@/lib/game-state";
import { CARS, carById, canBuyCar, ENGINE_COST, SPECIAL_COST } from "@/game/economy/cars";
import { CarArt } from "./CarArt";
const KEY = "hyunjun-selected-car-v1";
export function loadCarId() {
  try {
    return carById(typeof window === "undefined" ? "" : (window.localStorage.getItem(KEY) ?? ""))
      .id;
  } catch {
    return "car-001";
  }
}
export function saveCarId(id: string) {
  try {
    window.localStorage.setItem(KEY, carById(id).id);
  } catch {
    /* session selection */
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
  const { state, dispatch } = useGame();
  return (
    <div className="hj-garage-backdrop">
      <section
        className="hj-garage kid-garage"
        role="dialog"
        aria-modal="true"
        aria-label="자동차 성장 차고"
      >
        <header>
          <div>
            <h2>내 자동차를 키우자!</h2>
            <p>놀이로 돈을 벌어 새 기능을 열어 봐 · ⭐ {state.money}</p>
          </div>
          <button onClick={onClose}>닫기 ✕</button>
        </header>
        <div className="kid-car-list">
          {CARS.map((car) => {
            const owned = state.ownedCars.includes(car.id),
              up = state.carUpgrades[car.id];
            return (
              <article key={car.id} className={selected === car.id ? "chosen" : ""}>
                <CarArt car={car} size={110} />
                <div>
                  <h3>{car.name}</h3>
                  <p>{car.ability}</p>
                  <p>{car.upgrade}</p>
                </div>
                {owned ? (
                  <div className="kid-car-actions">
                    <button onClick={() => onSelect(car.id)} aria-pressed={selected === car.id}>
                      {selected === car.id ? "✓ 선택한 차" : "이 차 선택"}
                    </button>
                    <button
                      disabled={!!up?.engine || state.money < ENGINE_COST}
                      onClick={() =>
                        dispatch({ type: "upgrade-car", id: car.id, upgrade: "engine" })
                      }
                    >
                      {up?.engine ? "✓ 빠른 엔진" : "엔진 +15% · 60"}
                    </button>
                    <button
                      disabled={!!up?.special || state.money < SPECIAL_COST}
                      onClick={() =>
                        dispatch({ type: "upgrade-car", id: car.id, upgrade: "special" })
                      }
                    >
                      {up?.special ? "✓ 전용 기능 강화" : "전용 기능 강화 · 100"}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={!canBuyCar(state.ownedCars, car.id) || state.money < car.cost}
                    onClick={() => {
                      const next = dispatch({ type: "buy-car", id: car.id });
                      if (next.ownedCars.includes(car.id)) onSelect(car.id);
                    }}
                  >
                    {canBuyCar(state.ownedCars, car.id)
                      ? `${car.cost} 별코인 · 구입`
                      : "🔒 앞의 차를 먼저 구입"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
        <button className="hj-drive-now" onClick={onClose}>
          이 차 타고 출발!
        </button>
      </section>
    </div>
  );
}
