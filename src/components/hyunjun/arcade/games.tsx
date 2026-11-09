import type { ArcadeKey } from "@/game/play/arcade";
import {
  BALLOON_GOAL,
  BALLOON_MISSES,
  RING,
  createBalloons,
  inRing,
  tapBalloon,
  tickBalloons,
  type BalloonGame,
} from "@/game/play/minis/balloons";
import {
  COIN_GOAL,
  createCoins,
  tapFalling,
  tickCoins,
  type CoinGame,
} from "@/game/play/minis/coins";
import {
  JUMP_GOAL,
  JUMP_MISSES,
  createJump,
  jumpTo,
  tickJump,
  type JumpGame,
  type Pad,
} from "@/game/play/minis/jump";
import {
  CAR_ZONE,
  DODGE_GOAL,
  createDodge,
  steer,
  tickDodge,
  type DodgeGame,
} from "@/game/play/minis/dodge";
import {
  CLOUD_FALLS,
  CLOUD_GOAL,
  CLOUD_HALF,
  MARK,
  createCloud,
  jumpCloud,
  tickCloud,
  underMark,
  type CloudGame,
} from "@/game/play/minis/cloud";
import {
  SURF_FALLS,
  SURF_GOAL,
  ZONE,
  createSurf,
  inZone,
  setLean,
  tickSurf,
  type SurfGame,
} from "@/game/play/minis/surf";
import {
  PLOTS,
  WATER_GOAL,
  createWater,
  pour,
  tickWater,
  turnCan,
  type WaterGame,
} from "@/game/play/minis/water";
import {
  RANGE_GOAL,
  RANGE_MISSES,
  createRange,
  shoot,
  tickRange,
  type RangeGame,
} from "@/game/play/minis/range";
import type { ArcadeDef } from "./ArcadeShell";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const LANES3 = ["왼쪽", "가운데", "오른쪽"] as const;

// ── mn-02 풍선 터뜨리기 ──
const balloons: ArcadeDef<BalloonGame> = {
  key: "balloons",
  subtitle: "풍선이 금빛 고리 안에 들어왔을 때 톡!",
  icon: "🎈",
  intro: (
    <>
      <h2>금빛 고리에서 톡!</h2>
      <p>
        풍선이 아래에서 올라와요. 금빛 고리 안에 있을 때 누르면 펑!
        <br />
        고리 밖에서 누르면 실수예요. 실수 {BALLOON_MISSES}번이면 끝, 45초 안에 {BALLOON_GOAL}개!
      </p>
    </>
  ),
  create: createBalloons,
  tick: tickBalloons,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${BALLOON_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-field balloon-field" data-misses={g.misses}>
      <div
        className="balloon-ring"
        style={{ bottom: pct(RING.from), height: pct(RING.to - RING.from) }}
      />
      {g.balloons.map((b) => (
        <button
          key={b.id}
          className={`balloon lane-${b.lane}${inRing(b) ? " ready" : ""}`}
          style={{ bottom: pct(b.y), left: `${16 + b.lane * 34}%` }}
          disabled={!active}
          data-balloon={b.id}
          data-in-ring={inRing(b)}
          aria-label={`풍선 ${LANES3[b.lane]}${inRing(b) ? " · 지금!" : ""}`}
          onClick={() => act((x) => tapBalloon(x, b.id))}
        >
          🎈
        </button>
      ))}
    </div>
  ),
};

// ── mn-04 코인 톡톡 ──
const coins: ArcadeDef<CoinGame> = {
  key: "coins",
  subtitle: "떨어지는 코인은 톡, 번개 구름은 그냥 보내요.",
  icon: "🪙",
  intro: (
    <>
      <h2>코인만 톡톡!</h2>
      <p>
        코인과 번개 구름이 떨어져요. 코인을 누르면 +1,
        <br />
        번개 구름을 누르면 하트가 줄어요. 30초 안에 {COIN_GOAL}개!
      </p>
    </>
  ),
  create: createCoins,
  tick: tickCoins,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`❤ ${g.hearts}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-field coin-field" data-hearts={g.hearts}>
      {g.items.map((i) => (
        <button
          key={i.id}
          className={`falling ${i.kind}`}
          style={{ top: pct(i.y), left: `${6 + i.lane * 24}%` }}
          disabled={!active}
          data-item={i.id}
          data-kind={i.kind}
          aria-label={i.kind === "coin" ? "코인" : "번개 구름"}
          onClick={() => act((x) => tapFalling(x, i.id))}
        >
          {i.kind === "coin" ? "🪙" : "🌩️"}
        </button>
      ))}
    </div>
  ),
};

// ── mn-05 빠른 점프 ──
const jump: ArcadeDef<JumpGame> = {
  key: "jump",
  subtitle: "빛나는 발판으로 빠르게 점프!",
  icon: "🦘",
  intro: (
    <>
      <h2>빛나는 발판으로 점프!</h2>
      <p>
        발판 하나가 빛나요. 빛이 꺼지기 전에 그 발판을 눌러요.
        <br />
        점프할수록 빨라져요! 실수 {JUMP_MISSES}번이면 끝, {JUMP_GOAL}번 성공하면 우승!
      </p>
    </>
  ),
  create: createJump,
  tick: tickJump,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${JUMP_MISSES}`],
  View: ({ g, act, active }) => (
    <div className="arcade-field jump-field" data-target={g.target} data-at={g.at}>
      <div className="jump-timer" aria-hidden="true">
        <i style={{ width: pct(g.window ? g.remaining / g.window : 0) }} />
      </div>
      <div className="jump-pads">
        {([0, 1, 2] as Pad[]).map((p) => (
          <button
            key={p}
            className={`jump-pad${p === g.target ? " lit" : ""}`}
            disabled={!active}
            data-pad={p}
            data-lit={p === g.target}
            aria-label={`${LANES3[p]} 발판${p === g.target ? " · 빛나는 중" : ""}`}
            onClick={() => act((x) => jumpTo(x, p))}
          >
            <span aria-hidden="true">{p === g.at ? "🧒" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  ),
};

// ── mn-17 장애물 피하기 ──
const dodge: ArcadeDef<DodgeGame> = {
  key: "dodge",
  subtitle: "좌우로 차선을 바꿔 바위를 피해요.",
  icon: "🚗",
  intro: (
    <>
      <h2>바위를 피해 달려요</h2>
      <p>
        왼쪽·오른쪽 버튼으로 차선을 바꿔요. 바위 {DODGE_GOAL}개를 지나가면 성공!
        <br />
        부딪히면 하트가 줄어요. 하트 3개.
      </p>
    </>
  ),
  create: createDodge,
  tick: tickDodge,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`❤ ${g.hearts}`],
  View: ({ g, act, active }) => (
    <>
      <div className="arcade-field dodge-field" data-lane={g.lane} data-hearts={g.hearts}>
        <div className="dodge-lines" aria-hidden="true" />
        {g.rocks.map((r) => (
          <span
            key={r.id}
            className={`rock${r.hit ? " hit" : ""}`}
            style={{ top: pct(r.y), left: `${16 + r.lane * 34}%` }}
            data-rock={r.id}
            data-rock-lane={r.lane}
            data-rock-y={r.y.toFixed(2)}
            aria-hidden="true"
          >
            🪨
          </span>
        ))}
        <span
          className="dodge-car"
          style={{ top: pct(CAR_ZONE.from), left: `${16 + g.lane * 34}%` }}
          aria-label={`내 차 · ${LANES3[g.lane]} 차선`}
          role="img"
        >
          🚗
        </span>
      </div>
      <div className="dodge-controls">
        <button className="hj-big" disabled={!active} onClick={() => act((x) => steer(x, -1))}>
          ◀ 왼쪽
        </button>
        <button className="hj-big" disabled={!active} onClick={() => act((x) => steer(x, 1))}>
          오른쪽 ▶
        </button>
      </div>
    </>
  ),
};

// ── mn-12 구름 뛰기 ──
const cloud: ArcadeDef<CloudGame> = {
  key: "cloud",
  subtitle: "구름이 표시 아래에 오면 점프!",
  icon: "☁️",
  intro: (
    <>
      <h2>구름 위로 점프!</h2>
      <p>
        구름이 옆으로 흘러가요. 가운데 표시 아래에 왔을 때 「점프」를 눌러요.
        <br />빈 하늘로 뛰면 떨어져요. {CLOUD_FALLS}번 떨어지면 끝, {CLOUD_GOAL}번 착지하면 성공!
      </p>
    </>
  ),
  create: createCloud,
  tick: tickCloud,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`떨어짐 ${g.falls}/${CLOUD_FALLS}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <>
      <div
        className="arcade-field cloud-field"
        data-under={underMark(g.cloud)}
        data-cloud-x={g.cloud.x.toFixed(3)}
      >
        <div
          className="cloud-mark"
          style={{ left: pct(MARK - CLOUD_HALF), width: pct(CLOUD_HALF * 2) }}
          aria-hidden="true"
        >
          🧒
        </div>
        <span
          className={`cloud-pad${underMark(g.cloud) ? " under" : ""}`}
          style={{ left: pct(g.cloud.x) }}
          aria-hidden="true"
        >
          ☁️
        </span>
      </div>
      <button className="hj-big arcade-action" disabled={!active} onClick={() => act(jumpCloud)}>
        ⬆ 점프
      </button>
    </>
  ),
};

// ── mn-13 파도타기 ──
const lean = (dir: -1 | 0 | 1, act: (fn: (g: SurfGame) => SurfGame) => void) => ({
  onPointerDown: () => act((x) => setLean(x, dir)),
  onPointerUp: () => act((x) => setLean(x, 0)),
  onPointerLeave: () => act((x) => setLean(x, 0)),
  onPointerCancel: () => act((x) => setLean(x, 0)),
});
const surf: ArcadeDef<SurfGame> = {
  key: "surf",
  subtitle: "◀ ▶를 꾹 눌러 균형을 잡아요.",
  icon: "🏄",
  intro: (
    <>
      <h2>파도 위에서 균형!</h2>
      <p>
        파도가 바늘을 밀어요. ◀ 또는 ▶를 꾹 눌러 가운데 초록 구역에 머물러요.
        <br />
        초록 구역에 있는 1초마다 1점, {SURF_GOAL}점이면 성공! 끝에 {SURF_FALLS}번 닿으면 끝.
      </p>
    </>
  ),
  create: createSurf,
  tick: tickSurf,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`넘어짐 ${g.falls}/${SURF_FALLS}`],
  View: ({ g, act, active }) => (
    <>
      <div
        className="arcade-field surf-field"
        data-needle={g.needle.toFixed(3)}
        data-in-zone={inZone(g)}
      >
        <div className="surf-bar" aria-hidden="true">
          <i className="surf-zone" style={{ left: pct((1 - ZONE) / 2), width: pct(ZONE) }} />
          <b className="surf-needle" style={{ left: pct((g.needle + 1) / 2) }}>
            🏄
          </b>
        </div>
        <div className="surf-sea" aria-hidden="true">
          🌊🌊🌊
        </div>
      </div>
      <div className="dodge-controls">
        <button className="hj-big" disabled={!active} {...lean(-1, act)}>
          ◀ 왼쪽으로
        </button>
        <button className="hj-big" disabled={!active} {...lean(1, act)}>
          오른쪽으로 ▶
        </button>
      </div>
    </>
  ),
};

// ── mn-11 물주기 ──
const water: ArcadeDef<WaterGame> = {
  key: "water",
  subtitle: "물뿌리개를 맞춰 마른 밭에 물을 줘요.",
  icon: "🪴",
  intro: (
    <>
      <h2>마른 밭에 물 주기</h2>
      <p>
        ◀ ▶로 물뿌리개를 돌리고 「물 주기」. 바람이 가끔 물뿌리개를 밀어요!
        <br />
        물은 12번. 마른 밭 {WATER_GOAL}칸을 모두 적시면 성공!
      </p>
    </>
  ),
  create: createWater,
  tick: tickWater,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`💧 ${g.shots}`],
  View: ({ g, act, active }) => (
    <>
      <div className="arcade-field water-field" data-aim={g.aim}>
        <div className="water-can" style={{ left: pct((g.aim + 0.5) / PLOTS) }} aria-hidden="true">
          🚿
        </div>
        <div className="water-plots">
          {g.wet.map((w, i) => (
            <span
              key={i}
              className={`water-plot${w ? " wet" : ""}${i === g.aim ? " aimed" : ""}`}
              data-plot={i}
              data-wet={w}
            >
              {w ? "🌱" : "🟫"}
            </span>
          ))}
        </div>
      </div>
      <div className="water-controls">
        <button className="hj-big" disabled={!active} onClick={() => act((x) => turnCan(x, -1))}>
          ◀
        </button>
        <button className="hj-big" disabled={!active} onClick={() => act(pour)}>
          💧 물 주기
        </button>
        <button className="hj-big" disabled={!active} onClick={() => act((x) => turnCan(x, 1))}>
          ▶
        </button>
      </div>
    </>
  ),
};

// ── mn-20 로봇 사격장 ──
const range: ArcadeDef<RangeGame> = {
  key: "range",
  subtitle: "표적만 톡! 친구 로봇은 피해요.",
  icon: "🎯",
  intro: (
    <>
      <h2>안전한 에너지탄 사격장</h2>
      <p>
        표적 🎯이 나오면 눌러요. 친구 로봇 🤖 표지는 누르면 안 돼요.
        <br />
        30초 안에 표적 {RANGE_GOAL}개! 친구를 {RANGE_MISSES}번 누르면 끝.
      </p>
    </>
  ),
  create: createRange,
  tick: tickRange,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${RANGE_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-field range-field">
      <div className="range-grid">
        {[...Array(9).keys()].map((cell) => {
          const p = g.popups.find((x) => x.cell === cell);
          return p ? (
            <button
              key={`${cell}-${p.id}`}
              className={`range-pop ${p.kind}`}
              disabled={!active}
              data-pop={p.id}
              data-kind={p.kind}
              aria-label={p.kind === "target" ? "표적" : "친구 로봇"}
              onClick={() => act((x) => shoot(x, p.id))}
            >
              {p.kind === "target" ? "🎯" : "🤖"}
            </button>
          ) : (
            <span key={cell} className="range-hole" aria-hidden="true" />
          );
        })}
      </div>
    </div>
  ),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ARCADE_GAMES: Record<ArcadeKey, ArcadeDef<any>> = {
  balloons,
  coins,
  jump,
  dodge,
  cloud,
  surf,
  water,
  range,
};
