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
import {
  COOK_GOAL,
  COOK_MISSES,
  PANTRY,
  addIngredient,
  createCook,
  tickCook,
  type CookGame,
  type Ingredient,
} from "@/game/play/minis/cook";
import {
  THINGS,
  TIDY_GOAL,
  TIDY_MISSES,
  createTidy,
  putAway,
  tickTidy,
  type TidyGame,
  type Zone,
} from "@/game/play/minis/tidy";
import {
  BOX_GOAL,
  BOX_MISSES,
  SYMBOLS,
  createBox,
  openBox,
  tickBox,
  turnDial,
  type BoxGame,
} from "@/game/play/minis/box";
import {
  ASSEMBLE_GOAL,
  ASSEMBLE_MISSES,
  SLOT_NAME,
  createAssemble,
  outline,
  pickPart,
  placePart,
  tickAssemble,
  type AssembleGame,
  type Slot,
} from "@/game/play/minis/assemble";
import {
  LOOKALIKES,
  ROUND_SECONDS,
  SPOT_CELLS,
  SPOT_GOAL,
  SPOT_MISSES,
  createSpot,
  tapSpot,
  tickSpot,
  type SpotGame,
} from "@/game/play/minis/spot";
import {
  HINT_GOAL,
  HINT_MISSES,
  LANDS,
  LAND_NAME,
  LINE_NAME,
  createHint,
  guess,
  tickHint,
  type HintGame,
} from "@/game/play/minis/hint";
import {
  E,
  N,
  RESCUE_GOAL,
  S,
  SIZE,
  W,
  createRescue,
  tickRescue,
  turnTile,
  type RescueGame,
} from "@/game/play/minis/rescue";
import {
  COLS,
  PARK_BUMPS,
  PARK_GOAL,
  ROWS,
  createPark,
  drive,
  tickPark,
  type Dir,
  type ParkGame,
} from "@/game/play/minis/park";
import {
  SKY,
  STAR_GOAL,
  STAR_MISSES,
  createStars,
  tapSky,
  tickStars,
  type StarGame,
} from "@/game/play/minis/starhop";
import {
  FISH_GOAL,
  FISH_SNAPS,
  GREEN,
  createFish,
  pull,
  tickFish,
  type FishGame,
} from "@/game/play/minis/fishking";
import {
  BEACH,
  DIG_GOAL,
  DIG_TRIES,
  createDig,
  digAt,
  tickDig,
  type Clue,
  type DigGame,
} from "@/game/play/minis/dig";
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

// ── mn-14 음식 만들기 ──
const cook: ArcadeDef<CookGame> = {
  key: "cook",
  subtitle: "레시피 카드 순서대로 재료를 톡!",
  icon: "🍳",
  intro: (
    <>
      <h2>레시피대로 요리해요</h2>
      <p>
        카드에 나온 재료를 왼쪽부터 차례로 눌러요.
        <br />
        60초 안에 요리 {COOK_GOAL}개! 틀린 재료 {COOK_MISSES}번이면 끝.
      </p>
    </>
  ),
  create: createCook,
  tick: tickCook,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${COOK_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-board cook-board" data-next={g.recipe[g.step]}>
      <ol className="cook-card" aria-label="레시피 카드">
        {g.recipe.map((item, i) => (
          <li key={i} className={i < g.step ? "done" : i === g.step ? "now" : ""}>
            {i < g.step ? "✓" : PANTRY[item]}
          </li>
        ))}
      </ol>
      <div className="cook-pantry">
        {PANTRY.map((icon, i) => (
          <button
            key={icon}
            disabled={!active}
            data-item={i}
            aria-label={`재료 ${icon}`}
            onClick={() => act((x) => addIngredient(x, i as Ingredient))}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  ),
};

// ── mn-15 방 정리 ──
const ZONE_LABEL: Record<Zone, string> = {
  toys: "🧺 장난감 상자",
  books: "📚 책장",
  clothes: "🚪 옷장",
};
const tidy: ArcadeDef<TidyGame> = {
  key: "tidy",
  subtitle: "물건을 제자리에 넣어요.",
  icon: "🧹",
  intro: (
    <>
      <h2>방을 정리해요</h2>
      <p>
        바닥에 나온 물건을 장난감 상자·책장·옷장 중 맞는 곳에 넣어요.
        <br />
        60초 안에 {TIDY_GOAL}개! 틀린 곳 {TIDY_MISSES}번이면 끝.
      </p>
    </>
  ),
  create: createTidy,
  tick: tickTidy,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${TIDY_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => {
    const thing = THINGS[g.thing]!;
    return (
      <div className="arcade-board tidy-board" data-answer={thing.zone}>
        <div className="tidy-thing" role="img" aria-label={thing.name}>
          {thing.icon}
          <b>{thing.name}</b>
        </div>
        <div className="tidy-zones">
          {(Object.keys(ZONE_LABEL) as Zone[]).map((z) => (
            <button
              key={z}
              disabled={!active}
              data-zone={z}
              onClick={() => act((x) => putAway(x, z))}
            >
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>
      </div>
    );
  },
};

// ── mn-18 박스 열기 ──
const box: ArcadeDef<BoxGame> = {
  key: "box",
  subtitle: "그림 암호를 기억해서 상자를 열어요.",
  icon: "🎁",
  intro: (
    <>
      <h2>그림 암호 상자</h2>
      <p>
        상자 위에 그림 암호가 잠깐 보였다가 숨어요. 다이얼을 눌러 같은 그림으로 맞추고 「열기」!
        <br />
        상자 {BOX_GOAL}개, 틀리면 암호가 다시 보여요. {BOX_MISSES}번 틀리면 끝. 상자마다 보상은
        같아요.
      </p>
    </>
  ),
  create: createBox,
  tick: tickBox,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${BOX_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => {
    const showing = g.showing > 0;
    return (
      <div
        className="arcade-board box-board"
        data-showing={showing}
        data-code={g.code.join(",")}
        data-dials={g.dials.join(",")}
      >
        <div className="box-code" aria-label={showing ? "암호를 기억해요" : "암호가 숨었어요"}>
          {showing ? (
            g.code.map((c, i) => <span key={i}>{SYMBOLS[c]}</span>)
          ) : (
            <span>🔒 ? ? ?</span>
          )}
        </div>
        <div className="box-dials">
          {([0, 1, 2] as const).map((i) => (
            <button
              key={i}
              disabled={!active || showing}
              data-dial={i}
              aria-label={`${i + 1}번 다이얼 ${SYMBOLS[g.dials[i]]}`}
              onClick={() => act((x) => turnDial(x, i))}
            >
              {SYMBOLS[g.dials[i]]}
            </button>
          ))}
        </div>
        <button
          className="hj-big box-open"
          disabled={!active || showing}
          onClick={() => act(openBox)}
        >
          🎁 열기
        </button>
      </div>
    );
  },
};

// ── mn-09 로봇 조립 ──
const PART_ICON: Record<Slot, string> = {
  head: "🤖",
  body: "🟦",
  armL: "🦾",
  armR: "🦾",
  legs: "🦿",
};
const assemble: ArcadeDef<AssembleGame> = {
  key: "assemble",
  subtitle: "부품을 골라 로봇 빈자리에 넣어요.",
  icon: "🔧",
  intro: (
    <>
      <h2>로봇을 조립해요</h2>
      <p>
        아래 부품을 누르고, 로봇 그림에서 그 부품이 들어갈 빈자리를 눌러요.
        <br />
        로봇 {ASSEMBLE_GOAL}대! 틀린 자리 {ASSEMBLE_MISSES}번이면 끝. 시계 속 로봇 카드는 바뀌지
        않아요.
      </p>
    </>
  ),
  create: createAssemble,
  tick: tickAssemble,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${ASSEMBLE_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-board assemble-board" data-picked={g.picked ?? ""}>
      <div className="assemble-robot">
        {outline(g).map((slot) => {
          const done = g.placed.includes(slot);
          return (
            <button
              key={slot}
              className={`assemble-slot slot-${slot}${done ? " done" : ""}`}
              disabled={!active || done}
              data-slot={slot}
              aria-label={`${SLOT_NAME[slot]} 자리${done ? " · 끼움" : ""}`}
              onClick={() => act((x) => placePart(x, slot))}
            >
              {done ? PART_ICON[slot] : SLOT_NAME[slot]}
            </button>
          );
        })}
      </div>
      <div className="assemble-tray" aria-label="부품 상자">
        {g.tray.map((part) => (
          <button
            key={part}
            className={g.picked === part ? "picked" : ""}
            disabled={!active}
            data-part={part}
            aria-pressed={g.picked === part}
            onClick={() => act((x) => pickPart(x, part))}
          >
            {PART_ICON[part]}
            <small>{SLOT_NAME[part]}</small>
          </button>
        ))}
      </div>
    </div>
  ),
};

// ── mn-03 숨은 로봇 찾기 ──
const spot: ArcadeDef<SpotGame> = {
  key: "spot",
  subtitle: "닮은 것들 사이에서 다른 하나를 찾아요.",
  icon: "🔍",
  intro: (
    <>
      <h2>다른 하나를 찾아라!</h2>
      <p>
        비슷한 그림 {SPOT_CELLS}개 중 하나만 달라요. 빛이 꺼지기 전에 찾아서 눌러요.
        <br />
        {SPOT_GOAL}라운드! 틀리거나 시간이 지나면 실수, {SPOT_MISSES}번이면 끝.
      </p>
    </>
  ),
  create: createSpot,
  tick: tickSpot,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${SPOT_MISSES}`],
  View: ({ g, act, active }) => {
    const [crowd, odd] = LOOKALIKES[g.pair]!;
    return (
      <div className="arcade-board spot-board" data-odd={g.odd}>
        <div className="jump-timer spot-timer" aria-hidden="true">
          <i style={{ width: pct(g.remaining / ROUND_SECONDS) }} />
        </div>
        <div className="spot-grid">
          {Array.from({ length: SPOT_CELLS }, (_, i) => (
            <button
              key={`${g.score}-${g.misses}-${i}`}
              disabled={!active}
              data-cell={i}
              aria-label={`${i + 1}번 그림`}
              onClick={() => act((x) => tapSpot(x, i))}
            >
              {i === g.odd ? odd : crowd}
            </button>
          ))}
        </div>
      </div>
    );
  },
};

// ── mn-10 전설 힌트 찾기 ──
const hint: ArcadeDef<HintGame> = {
  key: "hint",
  subtitle: "두 힌트가 가리키는 칸을 찾아요.",
  icon: "🗺️",
  intro: (
    <>
      <h2>전설은 어디에 숨었을까?</h2>
      <p>
        힌트 두 개를 봐요: 어느 줄(북쪽·남쪽·서쪽·동쪽·가운데)과 어떤 땅(숲·물가·산).
        <br />두 힌트에 맞는 칸은 딱 하나! {HINT_GOAL}번 찾으면 성공, 틀리기 {HINT_MISSES}번이면 끝.
      </p>
    </>
  ),
  create: createHint,
  tick: tickHint,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${HINT_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-board hint-board" data-answer={g.answer}>
      <p className="hint-clue" role="status">
        📍 {LINE_NAME[g.line.axis][g.line.index]} · {LANDS[g.land]} {LAND_NAME[g.land]}
      </p>
      <div className="hint-map">
        {g.map.map((land, i) => (
          <button
            key={i}
            disabled={!active}
            data-cell={i}
            aria-label={`${LAND_NAME[land]} 칸`}
            onClick={() => act((x) => guess(x, i))}
          >
            {LANDS[land]}
          </button>
        ))}
      </div>
      <p className="hint-compass" aria-hidden="true">
        ⬆ 북쪽 · ⬅ 서쪽 · 동쪽 ➡ · ⬇ 남쪽
      </p>
    </div>
  ),
};

// ── mn-16 친구 구하기 ──
const road = (m: number) => (
  <svg viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="30" cy="30" r="9" fill="#8a7a5a" />
    {m & N ? <rect x="21" y="0" width="18" height="34" fill="#8a7a5a" /> : null}
    {m & S ? <rect x="21" y="26" width="18" height="34" fill="#8a7a5a" /> : null}
    {m & E ? <rect x="26" y="21" width="34" height="18" fill="#8a7a5a" /> : null}
    {m & W ? <rect x="0" y="21" width="34" height="18" fill="#8a7a5a" /> : null}
  </svg>
);
const rescue: ArcadeDef<RescueGame> = {
  key: "rescue",
  subtitle: "길을 돌려서 친구에게 가는 길을 만들어요.",
  icon: "🛟",
  intro: (
    <>
      <h2>친구에게 가는 길</h2>
      <p>
        길 조각을 누르면 한 번씩 돌아가요. 왼쪽 위 현준이부터 오른쪽 아래 친구까지 길을 하나로
        이어요.
        <br />
        {RESCUE_GOAL}판을 150초 안에!
      </p>
    </>
  ),
  create: createRescue,
  tick: tickRescue,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-board rescue-board">
      <div className="rescue-row">
        <span className="rescue-end" aria-hidden="true">
          🧒➡
        </span>
        <div className="rescue-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {g.tiles.map((m, i) => (
            <button
              key={i}
              disabled={!active}
              data-tile={i}
              data-mask={m}
              aria-label={`${i + 1}번 길 조각 돌리기`}
              onClick={() => act((x) => turnTile(x, i))}
            >
              {road(m)}
            </button>
          ))}
        </div>
      </div>
      <span className="rescue-end friend" aria-hidden="true">
        ➡🐶
      </span>
    </div>
  ),
};

// ── mn-19 자동차 주차 ──
const ARROWS: [Dir, string][] = [
  ["up", "⬆"],
  ["left", "⬅"],
  ["right", "➡"],
  ["down", "⬇"],
];
const park: ArcadeDef<ParkGame> = {
  key: "park",
  subtitle: "콘을 피해 P칸에 주차해요.",
  icon: "🅿️",
  intro: (
    <>
      <h2>주차 선수!</h2>
      <p>
        화살표를 누르면 차가 한 칸씩 움직여요. 콘 🔶에 부딪히지 않게 P칸까지!
        <br />
        주차장 {PARK_GOAL}곳, 부딪힘 {PARK_BUMPS}번이면 끝.
      </p>
    </>
  ),
  create: createPark,
  tick: tickPark,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`부딪힘 ${g.bumps}/${PARK_BUMPS}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div
      className="arcade-board park-board"
      data-car={g.lot.car}
      data-spot={g.lot.spot}
      data-cones={g.lot.cones.join(",")}
    >
      <div
        className="park-lot"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        aria-label="주차장"
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span key={i} className={i === g.lot.spot ? "spot" : ""}>
            {i === g.lot.car ? "🚙" : g.lot.cones.includes(i) ? "🔶" : i === g.lot.spot ? "P" : ""}
          </span>
        ))}
      </div>
      <div className="park-pad">
        {ARROWS.map(([d, icon]) => (
          <button
            key={d}
            className={`park-${d}`}
            disabled={!active}
            data-dir={d}
            aria-label={`${icon} 움직이기`}
            onClick={() => act((x) => drive(x, d))}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  ),
};

// ── mn-01 별빛 모으기 ──
const starhop: ArcadeDef<StarGame> = {
  key: "starhop",
  subtitle: "순간 이동하는 별을 잡아요.",
  icon: "🌟",
  intro: (
    <>
      <h2>깜짝 별 잡기</h2>
      <p>
        별이 밤하늘에서 이리저리 순간 이동해요. 사라지기 전에 눌러요!
        <br />
        40초에 {STAR_GOAL}개. 빈 하늘을 누르면 실수, {STAR_MISSES}번이면 끝.
      </p>
    </>
  ),
  create: createStars,
  tick: tickStars,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`실수 ${g.misses}/${STAR_MISSES}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <div className="arcade-board star-board" data-at={g.at}>
      <div className="star-sky">
        {Array.from({ length: SKY }, (_, i) => (
          <button
            key={i}
            disabled={!active}
            data-cell={i}
            data-star={i === g.at}
            aria-label={i === g.at ? "별" : "빈 하늘"}
            onClick={() => act((x) => tapSky(x, i))}
          >
            {i === g.at ? "🌟" : ""}
          </button>
        ))}
      </div>
    </div>
  ),
};

// ── mn-06 낚시왕 ──
const fishking: ArcadeDef<FishGame> = {
  key: "fishking",
  subtitle: "입질이 오면 초록에서 당겨요.",
  icon: "🎣",
  intro: (
    <>
      <h2>낚시왕 도전</h2>
      <p>
        찌가 흔들리면 입질! 바늘이 초록 칸에 있을 때 「당기기」를 눌러요.
        <br />
        너무 일찍 당기거나 초록 밖에서 당기면 줄이 끊어져요. 물고기 {FISH_GOAL}마리, 줄 {FISH_SNAPS}
        번 끊기면 끝.
      </p>
    </>
  ),
  create: createFish,
  tick: tickFish,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`줄 ${FISH_SNAPS - g.snaps}`, `⏳ ${Math.ceil(g.remaining)}초`],
  View: ({ g, act, active }) => (
    <>
      <div
        className="arcade-board fish-board"
        data-phase-fish={g.phase}
        data-needle={g.needle.toFixed(3)}
        data-green={g.green.toFixed(3)}
      >
        <div className={`fish-float${g.phase === "bite" ? " bite" : ""}`} aria-hidden="true">
          {g.phase === "bite" ? "🐟💦" : "🎈"}
        </div>
        <p className="fish-say" role="status">
          {g.phase === "bite" ? "입질이다! 초록에서 당겨!" : "기다려요…"}
        </p>
        <div className="surf-bar fish-gauge" aria-hidden="true">
          {g.phase === "bite" && (
            <i className="surf-zone" style={{ left: pct(g.green), width: pct(GREEN) }} />
          )}
          {g.phase === "bite" && <b className="fish-needle" style={{ left: pct(g.needle) }} />}
        </div>
      </div>
      <button className="hj-big arcade-action" disabled={!active} onClick={() => act(pull)}>
        🎣 당기기
      </button>
    </>
  ),
};

// ── mn-07 보물찾기 ──
const CLUE: Record<Clue, string> = { found: "💰", hot: "🔥", warm: "🌤️", cold: "❄️" };
const CLUE_WORD: Record<Clue, string> = {
  found: "보물!",
  hot: "뜨거워",
  warm: "따뜻해",
  cold: "차가워",
};
const dig: ArcadeDef<DigGame> = {
  key: "dig",
  subtitle: "힌트를 보고 모래 속 보물을 찾아요.",
  icon: "🏝️",
  intro: (
    <>
      <h2>모래 속 보물 3개</h2>
      <p>
        모래를 파면 가장 가까운 보물까지 거리를 알려 줘요: 🔥 뜨거워(바로 옆), 🌤️ 따뜻해(두 칸), ❄️
        차가워.
        <br />
        삽질 {DIG_TRIES}번 안에 보물 {DIG_GOAL}개!
      </p>
    </>
  ),
  create: createDig,
  tick: tickDig,
  outcome: (g) => g.outcome,
  score: (g) => g.score,
  hud: (g) => [`🪏 ${g.tries}`],
  View: ({ g, act, active }) => (
    <div className="arcade-board dig-board" data-treasures={g.treasures.join(",")}>
      <div className="dig-beach" style={{ gridTemplateColumns: `repeat(${BEACH}, 1fr)` }}>
        {Array.from({ length: BEACH * BEACH }, (_, i) => {
          const clue = g.dug[i];
          return (
            <button
              key={i}
              disabled={!active || !!clue}
              data-cell={i}
              data-clue={clue ?? ""}
              aria-label={clue ? CLUE_WORD[clue] : `${i + 1}번 모래 파기`}
              onClick={() => act((x) => digAt(x, i))}
            >
              {clue ? CLUE[clue] : ""}
            </button>
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
  cook,
  tidy,
  box,
  assemble,
  spot,
  hint,
  rescue,
  park,
  starhop,
  fishking,
  dig,
};
