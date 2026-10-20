import { usePlayerIdentity } from "./useFamilyAccount";
import { useState } from "react";
import { CROPS, cropById, useGame, type CropId } from "@/lib/game-state";
import { CropArt } from "./Art";
import { Shell } from "./Shell";
export function Farm() {
  const identity = usePlayerIdentity();
  const { state, ready, dispatch, getState } = useGame();
  const [selected, setSelected] = useState<CropId>("radish");
  const [msg, setMsg] = useState("무료 동글 무부터 심어봐!");
  const care = (i: number) => {
    const before = getState(),
      p = before.plots[i];
    if (!p) return;
    if (!p.crop) {
      const c = cropById(selected);
      if (before.money < c.seedCost) {
        setMsg("별코인이 부족해도 괜찮아. 무료 동글 무를 심자!");
        return;
      }
      dispatch({ type: "plant", index: i, crop: selected });
      setMsg(`${c.name}를 심었어! 다시 톡 눌러 물을 줘.`);
      return;
    }
    const c = cropById(p.crop);
    if (p.water < c.waterNeeded) {
      const a = dispatch({ type: "water", index: i });
      setMsg(
        (a.plots[i]?.water ?? 0) >= c.waterNeeded
          ? "다 자랐어! 한 번 더 톡 눌러 수확하자."
          : "물 한 모금! 쑥쑥 자라고 있어.",
      );
      return;
    }
    const a = dispatch({ type: "harvest", index: i });
    setMsg(`수확 성공! 별코인 ${a.money - before.money}개!`);
  };
  return (
    <Shell
      active="farm"
      title={`${identity.name}의 반짝 농장`}
      subtitle="심고, 물 주고, 수확해요. 실패는 없어요."
    >
      <div className="hj-seeds">
        {CROPS.map((c) => (
          <button
            key={c.id}
            aria-pressed={selected === c.id}
            className={selected === c.id ? "selected" : ""}
            onClick={() => setSelected(c.id)}
          >
            <CropArt id={c.id} grown />
            <b>{c.name}</b>
            <span>{c.seedCost ? `${c.seedCost} 별코인` : "무료"}</span>
          </button>
        ))}
      </div>
      <section className="hj-garden">
        <h2>{identity.name}의 작은 밭</h2>
        <div className="hj-plots">
          {state.plots.map((p, i) => {
            const c = p.crop ? cropById(p.crop) : null,
              grown = !!c && p.water >= c.waterNeeded;
            return (
              <button key={i} disabled={!ready} onClick={() => care(i)}>
                <span className="plot-no">{i + 1}</span>
                {c ? <CropArt id={c.id} grown={grown} /> : <span className="empty">＋</span>}
                <b>{c ? (grown ? "수확하기" : "물 주기") : "씨앗 심기"}</b>
                <small>{c ? `물 ${p.water}/${c.waterNeeded}` : "빈 밭"}</small>
              </button>
            );
          })}
        </div>
      </section>
      <p className="hj-message" role="status">
        {msg}
      </p>
    </Shell>
  );
}
