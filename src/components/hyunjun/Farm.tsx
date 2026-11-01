import { usePlayerIdentity } from "./useFamilyAccount";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CROPS, cropById, useGame, type CropId } from "@/lib/game-state";
import {
  GREENHOUSE_BEDS,
  GREENHOUSE_SPAWN,
  canCareGreenhouse,
  greenhouseAction,
  nearGreenhouseDoor,
  stepGreenhouse,
} from "@/game/play/greenhouse";
import { CropArt } from "./Art";
import { PlayerAvatar } from "./PlayerAvatar";
import { Joystick } from "./Joystick";
import { useMovement } from "./useMovement";
import { Shell } from "./Shell";
import "./adventure.css";
import "./greenhouse.css";
export function Farm() {
  const identity = usePlayerIdentity();
  const nav = useNavigate();
  const { state, ready, dispatch, getState } = useGame();
  const [selected, setSelected] = useState<CropId>("radish");
  const [target, setTarget] = useState(4);
  const [position, setPosition] = useState({ ...GREENHOUSE_SPAWN });
  const [walking, setWalking] = useState(false);
  const [working, setWorking] = useState<{ index: number; type: string } | null>(null);
  const busy = useRef(false);
  const seeds = useRef<HTMLDetailsElement>(null);
  const [msg, setMsg] = useState("온실에 왔어요! 밭을 고르고 조이스틱으로 가까이 걸어가요.");
  const choosePlot = (index: number) => {
    setTarget(index);
    setMsg(`${index + 1}번 밭을 골랐어요. 가까이 걸어간 뒤 돌보기 버튼을 눌러요.`);
  };
  const care = () => {
    if (!ready || busy.current) return;
    const before = getState();
    if (!canCareGreenhouse(position, target)) {
      setMsg(`${target + 1}번 밭 앞으로 걸어가면 돌볼 수 있어요.`);
      return;
    }
    const action = greenhouseAction(position, target, before.plots, selected, before.money);
    if (!action) {
      setMsg("별코인이 부족해요. 씨앗 고르기에서 무료 동글 무를 골라요.");
      return;
    }
    const after = dispatch(action);
    if (after === before) return;
    busy.current = true;
    setWorking({ index: target, type: action.type });
    if (action.type === "plant") setMsg(`${cropById(selected).name}를 심었어요! 물을 줘 봐요.`);
    else if (action.type === "water")
      setMsg(
        after.plots[target]!.water >= cropById(after.plots[target]!.crop!).waterNeeded
          ? "다 자랐어요! 수확할 수 있어요."
          : "물을 줬어요. 쑥쑥 자라고 있어요!",
      );
    else setMsg(`수확 성공! 별코인 ${after.money - before.money}개를 받았어요.`);
  };
  const movement = useMovement(ready && !working, care);
  const direction = useRef(movement.direction);
  direction.current = movement.direction;
  useEffect(() => {
    let frame = 0,
      last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const d = direction.current();
      setPosition((p) => stepGreenhouse(p, d, dt));
      setWalking(!!(d.x || d.y));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!working) return;
    const timer = window.setTimeout(() => {
      busy.current = false;
      setWorking(null);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [working]);
  const plot = state.plots[target]!;
  const crop = plot.crop ? cropById(plot.crop) : null;
  const near = canCareGreenhouse(position, target);
  const actionLabel = !near
    ? "밭 앞으로 걸어가요"
    : !crop
      ? "씨앗 심기"
      : plot.water < crop.waterNeeded
        ? "물 주기"
        : "수확하기";
  return (
    <Shell
      active="farm"
      showHomeReturn={false}
      className="greenhouse-shell"
      title="박현준 온실 농장"
      subtitle="밭까지 걸어가 심고, 물 주고, 수확해요."
    >
      <section
        className="greenhouse-game"
        data-x={position.x}
        data-y={position.y}
        data-target={target}
        data-near={near}
        data-working={!!working}
      >
        <div className="greenhouse-toolbar">
          <span>🧺 지금까지 수확 {state.harvests}번</span>
          <details ref={seeds}>
            <summary>🌱 씨앗 고르기 · {cropById(selected).name}</summary>
            <div className="greenhouse-seeds">
              {CROPS.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={selected === c.id}
                  aria-label={`${c.name} 씨앗 ${c.seedCost ? `${c.seedCost} 별코인` : "무료"}`}
                  onClick={() => {
                    setSelected(c.id);
                    if (seeds.current) {
                      seeds.current.open = false;
                      seeds.current.querySelector("summary")?.focus({ preventScroll: true });
                    }
                  }}
                >
                  <CropArt id={c.id} grown />
                  <b>{c.name}</b>
                  <span>{c.seedCost ? `${c.seedCost} 별코인` : "무료"}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
        <div
          className="greenhouse-scene"
          role="group"
          aria-label="직접 걸어 다니는 온실, 여섯 밭 사이 통로"
        >
          <div className="greenhouse-windows" aria-hidden="true">
            ☀️ 🌤️ ☀️
          </div>
          {state.plots.map((p, i) => {
            const bed = GREENHOUSE_BEDS[i]!;
            const c = p.crop ? cropById(p.crop) : null;
            const grown = !!c && p.water >= c.waterNeeded;
            return (
              <button
                key={i}
                className={`greenhouse-bed ${i === target ? "chosen" : ""}`}
                style={{ left: `${(bed.x - 60) / 6}%`, top: `${(bed.y - 45) / 5}%` }}
                aria-label={`${i + 1}번 밭 선택 · ${c ? `${p.gold ? c.goldName : c.name} 물 ${p.water}/${c.waterNeeded}` : "빈 밭"}`}
                aria-pressed={i === target}
                onClick={() => choosePlot(i)}
                onPointerUp={(event) => {
                  // Touch/pen selection does not depend on a synthesized click after dragging.
                  if (event.pointerType !== "mouse") choosePlot(i);
                }}
              >
                <span className="greenhouse-bed-number">{i + 1}</span>
                {c ? <CropArt id={c.id} grown={grown} /> : <span aria-hidden="true">🌱</span>}
                <small>
                  {c
                    ? `${p.gold ? "✨ " : ""}${grown ? "수확!" : `물 ${p.water}/${c.waterNeeded}`}`
                    : "빈 밭"}
                </small>
              </button>
            );
          })}
          <div
            className="greenhouse-player"
            style={{ left: `${position.x / 6}%`, top: `${position.y / 5}%` }}
          >
            <PlayerAvatar
              identity={identity.id}
              outfit={state.outfit}
              moving={walking}
              width={64}
              height={80}
            />
            <span>{identity.name}</span>
            {working && (
              <i className="greenhouse-tool" aria-hidden="true">
                {working.type === "water" ? "🚿" : working.type === "plant" ? "🌱" : "🧺"}
              </i>
            )}
          </div>
          {working && (
            <span
              className="greenhouse-effect"
              aria-hidden="true"
              style={{
                left: `${GREENHOUSE_BEDS[working.index]!.x / 6}%`,
                top: `${GREENHOUSE_BEDS[working.index]!.y / 5}%`,
              }}
            >
              {working.type === "water" ? "💧💧" : working.type === "harvest" ? "✨" : "🌱"}
            </span>
          )}
          <span className="greenhouse-door" aria-hidden="true">
            🚪 입구
          </span>
        </div>
        <p className="greenhouse-message" role="status">
          {msg}
        </p>
        <div className="greenhouse-controls">
          <Joystick onMove={movement.setStick} disabled={!ready || !!working} />
          <div className="greenhouse-actions">
            <strong>
              {target + 1}번 밭 · {crop ? crop.name : "빈 밭"}
            </strong>
            <button className="greenhouse-care" disabled={!ready || !!working} onClick={care}>
              {working ? "돌보는 중…" : actionLabel}
            </button>
            <button
              disabled={!nearGreenhouseDoor(position) || !!working}
              onClick={() => {
                if (nearGreenhouseDoor(position) && !busy.current) void nav({ to: "/" });
              }}
            >
              온실 밖으로
            </button>
          </div>
        </div>
        <p className="greenhouse-help">
          밭 그림은 선택만 해요 · 가까이서 돌보기 · 키보드 방향키 / E
        </p>
        <Link className="greenhouse-return" to="/kart">
          카트로 돌아가기
        </Link>
      </section>
    </Shell>
  );
}
