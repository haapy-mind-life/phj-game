# 박현준 게임 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `carrot-racer-farm` 하나에서 마을, 박현준 러너, 반짝 농장, 우리 집 꾸미기가 공통 저장 데이터를 공유하며 동작하도록 한다.

**Architecture:** 기존 TanStack Start 라우팅은 유지하고, 게임 상태와 러너 엔진을 순수 TypeScript 모듈로 분리한다. UI는 `src/components/hyunjun/`에 모으고 모바일 터치 중심으로 구성한다. 기존 저장 데이터는 v2 모델로 마이그레이션한다.

**Tech Stack:** React 19, TanStack Router/Start, TypeScript, Canvas 2D, Tailwind CSS 4, node:test, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-09-15-hyunjun-integrated-game-design.md`

## Global Constraints
- 최종 통합 저장소는 `haapy-mind-life/carrot-racer-farm`이다.
- force push/rebase/amend로 게시 이력을 재작성하지 않는다.
- 모바일 터치가 기본이며 텍스트 입력 UI를 추가하지 않는다.
- 러너 기본 모드는 어린이 친화적인 산책 모드다.
- 공통 지갑은 실제 화폐가 아닌 `별코인`으로 표시한다.
- 기존 `hyunjun-game-v1` 및 `runner-best` 저장 값을 안전하게 이관한다.

---

### Task 1: 공통 상태 모델과 저장 마이그레이션

**Files:**
- Create: `src/lib/world-model.ts`
- Create: `src/lib/world-store.ts`
- Modify: `src/lib/game-state.ts`
- Test: `src/lib/world-model.test.ts`
- Test: `src/lib/world-store.test.ts`

**Interfaces:**
- Produces: `GameState`, `WorldAction`, `migrateSave(input)`, `reduceWorld(state, action)`, `createWorldStore(getStorage)`.

- [ ] **Step 1: failing tests 작성** — v1 마이그레이션, 잘못된 값 방어, 무료 씨앗 심기/수확, 중복 러너 정산 방지, 저장 실패 fallback을 검증한다.
- [ ] **Step 2: `node --test`로 RED 확인** — 모듈 부재 또는 기대 동작 부재로 실패해야 한다.
- [ ] **Step 3: 최소 구현 작성** — v2 모델/reducer/store를 구현한다.
- [ ] **Step 4: 테스트 GREEN 확인** — 관련 테스트가 모두 통과해야 한다.
- [ ] **Step 5: 작은 커밋** — `feat: add shared Hyunjun world state`.

### Task 2: 러너 엔진 이식과 어린이 난이도

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/combat.ts`
- Create: `src/game/progression.ts`
- Create: `src/game/runner-engine.ts`
- Test: `src/game/runner-engine.test.ts`
- Test: `src/game/progression.test.ts`

**Interfaces:**
- Consumes: `GameState`의 공통 별코인/기록.
- Produces: `createRun(mode)`, `tapRun(run)`, `advanceRun(run, seconds)`, `finishRun(run)`, `stageForScore(score)`.

- [ ] **Step 1: failing tests 작성** — 5단계 경계, 산책/도전 초기값, 더블 점프, 산책 보호, 크레인 재시도, 1000점 완주를 검증한다.
- [ ] **Step 2: RED 확인**.
- [ ] **Step 3: 기존 `park-runner-game` 규칙을 필요한 범위만 이식하고 산책 모드 보조를 구현**.
- [ ] **Step 4: GREEN 확인**.
- [ ] **Step 5: 커밋** — `feat: integrate child-friendly Hyunjun runner engine`.

### Task 3: 마을/농장/집/러너 UI와 라우팅

**Files:**
- Create: `src/components/hyunjun/Art.tsx`
- Create: `src/components/hyunjun/Shell.tsx`
- Create: `src/components/hyunjun/Village.tsx`
- Create: `src/components/hyunjun/Farm.tsx`
- Create: `src/components/hyunjun/House.tsx`
- Create: `src/components/hyunjun/Runner.tsx`
- Create: `src/game/runner-render.ts`
- Create: `src/hyunjun.css`
- Create: `src/routes/house.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/race.tsx`
- Modify: `src/routes/greenhouse.tsx`
- Modify: `src/routes/__root.tsx`

**Interfaces:**
- Consumes: Task 1 store + Task 2 runner engine.
- Produces: `/`, `/race`, `/greenhouse`, `/house` 화면.

- [ ] **Step 1: UI가 의존하는 순수 selector/route contract 테스트를 먼저 추가하고 RED 확인**.
- [ ] **Step 2: 공통 SVG 아트와 Shell 구현**.
- [ ] **Step 3: 움직이는 마을, 반짝 농장, 집 꾸미기 구현**.
- [ ] **Step 4: Canvas 러너와 공통 의상/별코인 정산 연결**.
- [ ] **Step 5: 모바일 360px/터치 CSS 작성**.
- [ ] **Step 6: 테스트 및 타입/빌드 검증 후 커밋** — `feat: build Hyunjun mini-game village UI`.

### Task 4: CI 및 통합 검증

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/hyunjun-ci.yml`

**Interfaces:**
- Produces: `npm test`, `npm run lint`, `npm run build` 검증 게이트.

- [ ] **Step 1: `test` script를 node:test 기반으로 추가**.
- [ ] **Step 2: feature branch push 및 main PR에서 test/lint/build가 실행되는 CI 추가**.
- [ ] **Step 3: CI에서 실제 세 명령이 모두 PASS인지 확인**.

### Task 5: 화면/회귀 점검 및 수정

**Files:** 필요한 UI 파일만 좁게 수정.

- [ ] **Step 1: 홈→러너→홈, 홈→농장, 홈→집의 라우팅/저장 흐름 점검**.
- [ ] **Step 2: 키보드/텍스트 입력 UI가 없는지 확인**.
- [ ] **Step 3: 모바일 레이아웃, 버튼 hit-area, overflow, reduced-motion 확인**.
- [ ] **Step 4: 발견한 결함마다 failing regression test를 먼저 작성하고 수정**.
- [ ] **Step 5: 최종 test/lint/build 재실행**.

### Task 6: PR 전 코드 리뷰 및 Git 검증

- [ ] **Step 1: `main...feature` 비교에서 base/head 방향과 non-zero diff 확인**.
- [ ] **Step 2: 예상 밖 파일/비밀/생성물 포함 여부 확인**.
- [ ] **Step 3: PR head SHA에 대한 CI 상태 확인**.
- [ ] **Step 4: 중요한 리뷰 이슈가 있으면 수정 후 다시 검증**.

### Task 7: PR 생성

- [ ] **Step 1: 검증된 head SHA를 다시 확인**.
- [ ] **Step 2: `feat/hyunjun-integrated-game` → `main` PR 생성**.
- [ ] **Step 3: PR 본문에 사용자 변화, 테스트 근거, 남은 실제 기기 acceptance를 명시**.
- [ ] **Step 4: merge는 별도 승인 전 수행하지 않는다**.
