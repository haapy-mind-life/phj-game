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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ARCADE_GAMES: Record<ArcadeKey, ArcadeDef<any>> = { balloons, coins, jump, dodge };
