# 박현준 러너 전투·파워업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 러너 흐름을 보존하면서 총/화살 전투, 적 2종, 방탄 1회 방어, 버섯 거대화, 데스크톱/모바일 조작을 추가한다.

**Architecture:** 전투 규칙은 `src/game/types.ts`와 `src/game/combat.ts`의 순수 TypeScript로 분리해 테스트 가능하게 만들고, `src/routes/index.tsx`는 기존 게임 루프·Canvas 렌더링·입력·HUD 통합을 담당한다. 테스트는 Node 22의 built-in test runner와 TypeScript type stripping을 사용해 신규 의존성을 추가하지 않는다.

**Tech Stack:** React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Node 22 built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-05-combat-powerups-design.md`

## Global Constraints

- 시작 장비: 방탄 1, 총알 12, 화살 6.
- 총 처치 +50점, 화살 처치 +80점.
- 적은 땅 적/하늘 적 2종.
- 거대화는 약 1.5배 시각 크기, 약 8초, 적 충돌 시 적 제거 후 생존.
- 기존 점프/스프링/구름길/비구름/우산/1000점 클리어 동작을 유지한다.
- published Git history를 force-push/rebase/amend/squash 하지 않는다.
- `main`에는 검증된 순방향 커밋만 반영한다.

---

### Task 1: 순수 전투 도메인과 RED 테스트

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/combat.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `WeaponKind = "gun" | "bow"`
- Produces `Enemy`, `Projectile`, `PlayerCombatState`, `CombatHitResult`
- Future production API under test: `fireProjectile`, `resolveProjectileHits`, `resolveEnemyContact`, `activateMushroom`

- [ ] **Step 1: 테스트 스크립트 추가**

`package.json` scripts에 다음을 추가한다.

```json
"test": "node --experimental-strip-types --test src/game/*.test.ts"
```

- [ ] **Step 2: 타입과 기대 API를 기준으로 실패 테스트 작성**

`src/game/combat.test.ts`에 아래 행위를 각각 독립 테스트로 작성한다.

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  activateMushroom,
  fireProjectile,
  resolveEnemyContact,
  resolveProjectileHits,
} from "./combat.ts";

const base = { armor: 1, bullets: 12, arrows: 6, giantTimer: 0 };

test("gun shot consumes one bullet and creates a gun projectile", () => {
  const result = fireProjectile(base, "gun", 140, 200);
  assert.equal(result.state.bullets, 11);
  assert.equal(result.projectile?.weapon, "gun");
});

test("gun does not fire with zero bullets", () => {
  const result = fireProjectile({ ...base, bullets: 0 }, "gun", 140, 200);
  assert.equal(result.projectile, null);
  assert.equal(result.state.bullets, 0);
});

test("bow shot consumes one arrow", () => {
  const result = fireProjectile(base, "bow", 140, 200);
  assert.equal(result.state.arrows, 5);
});

test("gun kill awards 50 points once", () => {
  const enemy = [{ id: 1, kind: "ground", x: 200, y: 240, w: 30, h: 40, alive: true }];
  const shots = [{ id: 1, weapon: "gun", x: 205, y: 250, vx: 12, w: 12, h: 5 }];
  const result = resolveProjectileHits(enemy, shots);
  assert.equal(result.scoreDelta, 50);
  assert.equal(result.enemies.length, 0);
});

test("bow kill awards 80 points once", () => {
  const enemy = [{ id: 1, kind: "air", x: 200, y: 120, w: 34, h: 28, alive: true }];
  const shots = [{ id: 1, weapon: "bow", x: 205, y: 125, vx: 9, w: 22, h: 6 }];
  const result = resolveProjectileHits(enemy, shots);
  assert.equal(result.scoreDelta, 80);
});

test("giant contact removes enemy without consuming armor", () => {
  const result = resolveEnemyContact({ ...base, giantTimer: 100 });
  assert.equal(result.survives, true);
  assert.equal(result.consumeEnemy, true);
  assert.equal(result.state.armor, 1);
});

test("armor absorbs one enemy contact", () => {
  const result = resolveEnemyContact({ ...base, giantTimer: 0 });
  assert.equal(result.survives, true);
  assert.equal(result.state.armor, 0);
});

test("contact without giant or armor is fatal", () => {
  const result = resolveEnemyContact({ ...base, armor: 0, giantTimer: 0 });
  assert.equal(result.survives, false);
});

test("mushroom activates giant timer", () => {
  assert.equal(activateMushroom(base).giantTimer, 480);
});
```

- [ ] **Step 3: RED 확인**

Run: `npm test`
Expected: FAIL because `src/game/combat.ts` does not exist yet.

- [ ] **Step 4: Commit RED tests**

```bash
git add package.json src/game/types.ts src/game/combat.test.ts
git commit -m "test: define combat powerup behavior"
```

---

### Task 2: 전투 도메인 GREEN 구현

**Files:**
- Create: `src/game/combat.ts`
- Modify: `src/game/types.ts`
- Test: `src/game/combat.test.ts`

**Interfaces:**
- `fireProjectile(state, weapon, x, y): { state; projectile }`
- `resolveProjectileHits(enemies, projectiles): { enemies; projectiles; scoreDelta }`
- `resolveEnemyContact(state): { state; survives; consumeEnemy }`
- `activateMushroom(state): PlayerCombatState`

- [ ] **Step 1: 최소 타입 정의**

```ts
export type WeaponKind = "gun" | "bow";
export type EnemyKind = "ground" | "air";

export type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

export type Projectile = {
  id: number;
  weapon: WeaponKind;
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
};

export type PlayerCombatState = {
  armor: number;
  bullets: number;
  arrows: number;
  giantTimer: number;
};
```

- [ ] **Step 2: 최소 production 구현**

`combat.ts`에서 총 속도 14/크기 12x5, 화살 속도 10/크기 22x6을 사용한다. AABB 충돌로 명중을 판정하고, 한 적이 제거되면 이후 발사체가 같은 적에 추가 점수를 주지 못하게 한다.

```ts
export const GUN_SCORE = 50;
export const BOW_SCORE = 80;
export const GIANT_FRAMES = 480;
```

- [ ] **Step 3: GREEN 확인**

Run: `npm test`
Expected: all combat tests PASS.

- [ ] **Step 4: Refactor 후 재실행**

중복 AABB 판정을 `overlaps(a, b)` 하나로 정리하고 다시 `npm test`를 실행한다.

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/game/combat.ts src/game/combat.test.ts
git commit -m "feat: add combat domain rules"
```

---

### Task 3: 러너 루프에 전투·버섯·입력 통합

**Files:**
- Modify: `src/routes/index.tsx`
- Consume: `src/game/types.ts`, `src/game/combat.ts`

**Interfaces:**
- Uses `fireProjectile`, `resolveProjectileHits`, `resolveEnemyContact`, `activateMushroom`

- [ ] **Step 1: 전투 상태 초기화 추가**

`game.current`에 다음을 추가한다.

```ts
enemies: [] as Enemy[],
projectiles: [] as Projectile[],
mushrooms: [] as Mushroom[],
armor: 1,
bullets: 12,
arrows: 6,
giantTimer: 0,
nextId: 1,
```

React HUD state는 `armor`, `bullets`, `arrows`, `giant` 네 개를 추가하고 `start()`에서 모두 초기화한다.

- [ ] **Step 2: 발사 콜백 추가**

```ts
const shoot = useCallback((weapon: WeaponKind) => {
  const g = game.current;
  if (!g.running) return;
  const result = fireProjectile(
    { armor: g.armor, bullets: g.bullets, arrows: g.arrows, giantTimer: g.giantTimer },
    weapon,
    158,
    g.y + 22,
  );
  g.armor = result.state.armor;
  g.bullets = result.state.bullets;
  g.arrows = result.state.arrows;
  if (result.projectile) {
    result.projectile.id = g.nextId++;
    g.projectiles.push(result.projectile);
  }
  setBullets(g.bullets);
  setArrows(g.arrows);
}, []);
```

키 입력은 `X -> gun`, `C -> bow`, 기존 Space/ArrowUp 점프를 유지한다.

- [ ] **Step 3: 적/버섯 생성과 이동 추가**

- 땅 적: 약 0.007 확률, 지면 높이
- 하늘 적: 약 0.0045 확률, y 120~190 범위
- 버섯: 약 0.0025 확률, 지면 접근 높이
- 각 개체는 마지막 개체와 최소 300px 이상 간격을 두도록 조건을 추가한다.

- [ ] **Step 4: 전투 충돌과 점수 연결**

발사체 이동 후 `resolveProjectileHits`를 호출한다. `scoreDelta`를 `g.score`에 합산하고 기존 `levelOf`와 1000점 클리어 판정이 그대로 적용되게 한다.

적/플레이어 AABB 충돌 시 `resolveEnemyContact` 결과를 적용한다. 거대화 또는 방탄으로 생존하면 해당 적만 제거하고, 생존하지 못하면 기존 game over 흐름을 호출한다.

- [ ] **Step 5: 버섯 획득 연결**

플레이어와 버섯이 겹치면 `activateMushroom`으로 `giantTimer = 480`을 적용하고 버섯을 제거한다. 매 프레임 타이머를 1 감소시키며 `giantTimer > 0`인 동안 HUD `giant=true`를 유지한다.

- [ ] **Step 6: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: integrate combat and mushroom gameplay"
```

---

### Task 4: Canvas 렌더링·HUD·모바일 컨트롤

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/styles.css` only if existing utility classes cannot express required layout

- [ ] **Step 1: Canvas 도형 렌더링 추가**

- 땅 적: 둥근 사각형 몸체 + 눈
- 하늘 적: 날개가 있는 원형 캐릭터
- 총알: 작은 캡슐
- 화살: shaft line + triangular head
- 버섯: 줄기 + 반원 모자
- 거대화: 플레이어 이미지 draw 크기만 1.5배로 확대하되 충돌 박스는 기존 크기 유지
- 방탄 보유 시 플레이어 주변 얇은 보호 링 표시

- [ ] **Step 2: HUD 추가**

기존 점수/단계/최고 영역 아래 또는 같은 폭 영역에 다음을 표시한다.

```text
방탄 {armor}   총알 {bullets}   화살 {arrows}   [거대화 시 버섯 파워]
```

- [ ] **Step 3: 모바일/터치 컨트롤 추가**

캔버스 아래에 `점프`, `총`, `활` 버튼을 추가한다. 각 버튼에서 `e.stopPropagation()` 후 각각 `jump()`, `shoot("gun")`, `shoot("bow")`를 호출한다.

- [ ] **Step 4: 안내 문구 갱신**

헤더 설명을 `Space/↑ 점프 · X 총 · C 활 · 화면 버튼 지원`으로 변경한다.

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx src/styles.css
git commit -m "feat: render combat hud and touch controls"
```

---

### Task 5: CI 검증과 최종 회귀 확인

**Files:**
- Create: `.github/workflows/combat-ci.yml`
- Modify: `docs/superpowers/specs/2026-09-05-combat-powerups-design.md` after verification

- [ ] **Step 1: CI workflow 추가**

```yaml
name: Combat CI
on:
  push:
    branches: ["feat/combat-powerups"]
  pull_request:
    branches: ["main"]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 2: CI 실행 확인**

Expected: `npm test`, `npm run lint`, `npm run build` all PASS.

- [ ] **Step 3: 실패 시 TDD로 수정**

전투 로직 버그는 먼저 실패 테스트를 추가하고 RED를 확인한 뒤 production 코드를 수정한다. lint/build 문제는 해당 오류 위치만 최소 수정한다.

- [ ] **Step 4: 스펙 상태 갱신**

검증 완료 후 설계 문서 상태를 `Implemented and verified`로 바꾸고 검증 커밋 SHA를 기록한다.

- [ ] **Step 5: 최종 Commit**

```bash
git add .github/workflows/combat-ci.yml docs/superpowers/specs/2026-09-05-combat-powerups-design.md
git commit -m "ci: verify combat powerups"
```

- [ ] **Step 6: main 반영 전 확인**

`main...feat/combat-powerups` 비교에서 변경 범위가 승인된 파일에 한정되는지 확인하고, 모든 CI가 green일 때만 fast-forward/merge commit 방식으로 `main`에 반영한다. force update는 금지한다.
