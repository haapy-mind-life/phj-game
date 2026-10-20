import { usePlayerIdentity } from "./useFamilyAccount";
import { useState } from "react";
import {
  FURNITURE,
  useGame,
  type FurnitureId,
  type Outfit,
  type Wallpaper,
} from "@/lib/game-state";
import { FurnitureArt, Mascot } from "./Art";
import { Shell } from "./Shell";
const outfits: [Outfit, string][] = [
  ["mint", "민트 곰돌이"],
  ["peach", "복숭아 탐험가"],
  ["lavender", "라벤더 별친구"],
];
const walls: [Wallpaper, string][] = [
  ["cream", "바닐라"],
  ["sky", "구름 하늘"],
  ["rose", "복숭아"],
];
export function House() {
  const identity = usePlayerIdentity();
  const { state, ready, dispatch, getState } = useGame();
  const [selected, setSelected] = useState<FurnitureId | null>("bed");
  const [msg, setMsg] = useState("가구를 고르고 방의 자리를 톡!");
  const choose = (id: FurnitureId) => {
    const item = FURNITURE.find((x) => x.id === id)!;
    const s = getState();
    if (!s.ownedFurniture.includes(id)) {
      if (s.money < item.cost) {
        setMsg("별코인을 조금 더 모아오자!");
        return;
      }
      dispatch({ type: "buy-furniture", id });
    }
    setSelected(id);
    setMsg(`${item.name}를 어디에 둘까?`);
  };
  return (
    <Shell
      active="room"
      title={`${identity.name}의 포근한 집`}
      subtitle="가구도 옷도 마음대로 꾸며요."
    >
      <div className={`hj-room wall-${state.wallpaper}`}>
        <div className="hj-room-title">HOME SWEET HOME</div>
        <div className="hj-room-grid">
          {state.room.map((id, i) => (
            <button
              key={i}
              disabled={!ready}
              onClick={() => {
                dispatch({ type: "place-furniture", id: selected, slot: i });
                setMsg("여기 정말 잘 어울린다!");
              }}
            >
              {id ? <FurnitureArt id={id} /> : <span>＋</span>}
              <small>{i + 1}</small>
            </button>
          ))}
        </div>
        <Mascot identity={identity.id} outfit={state.outfit} />
      </div>
      <div className="hj-wall-buttons">
        {walls.map(([id, name]) => (
          <button
            key={id}
            aria-pressed={state.wallpaper === id}
            onClick={() => dispatch({ type: "wallpaper", wallpaper: id })}
          >
            {name}
          </button>
        ))}
        <button onClick={() => setSelected(null)}>가구 치우기</button>
      </div>
      <section className="hj-shop">
        <h2>작은 가구 가게</h2>
        <div>
          {FURNITURE.map((item) => {
            const owned = state.ownedFurniture.includes(item.id);
            return (
              <button
                key={item.id}
                className={selected === item.id ? "selected" : ""}
                disabled={!ready || (!owned && state.money < item.cost)}
                onClick={() => choose(item.id)}
              >
                <FurnitureArt id={item.id} />
                <b>{item.name}</b>
                <span>{owned ? "가지고 있어요" : `${item.cost} 별코인`}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="hj-closet">
        <h2>오늘의 {identity.name}</h2>
        <div>
          {outfits.map(([id, name]) => (
            <button
              key={id}
              className={state.outfit === id ? "selected" : ""}
              onClick={() => dispatch({ type: "outfit", outfit: id })}
            >
              <Mascot identity={identity.id} outfit={id} small />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </section>
      <p className="hj-message" role="status">
        {msg}
      </p>
    </Shell>
  );
}
