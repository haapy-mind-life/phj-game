# 03. 슈퍼 로봇 합체 월드 — 구현 설계 (PROPOSED)

> 상태: **PROPOSED** · 2026-10-31 · 기준 코드: `main` 6765012
> 근거: Codex 독립 리뷰(읽기 전용) + Claude 코드 대조. 코드 근거는 **FACT**, 설계는 **PROPOSED**로 표시한다. 구현·빌드·브라우저 검증은 모두 NOT_RUN.

## 1. 지금 코드에서 로봇이 들어갈 자리 (FACT)

- 기존 로봇은 고정 액터 하나뿐이다: `src/game/actors.ts:8` `{ id: "robot", name: "로봇 친구", kind: "robot" }`. 순찰 이동은 `friend` 종류에만 적용된다(`actors.ts:41`).
- 사람·친구 그리기는 `src/components/hyunjun/People.tsx`, 가까운 대상·대화는 `useLivingWorld.ts`가 맡는다.
- 탈것(자동차·비행기·잠수함) 상태는 `Village.tsx`에 흩어져 있다. 이 파일은 이미 1600줄이 넘는다.
- 저장은 `src/lib/world-model.ts`의 `GameState`(`version: 3`)이고, 저장 키는 `hyunjun-game-v2`이다.
- 가족방 메시지(`src/game/family-room.ts`)에는 위치·지역·외형·이모트만 있다. 로봇이나 전투 상태는 없다.

**결론:** 액터 목록에 로봇을 몇 개 더 넣는 것만으로는 수집·탑승·전투가 되지 않는다. 로봇은 **별도 모듈**로 만들고 `Village.tsx`에는 연결 코드만 넣는다.

## 2. 모듈 구조 (PROPOSED)

| 파일 | 역할 |
|---|---|
| `src/game/robot-catalog.ts` | 로봇 종(種) 정의: id, 계열(경찰·소방·비행…), 그림 키, 부품, 기술. 1차는 3종 + 악당 1종 |
| `src/game/robot-engine.ts` | 순수 로직: 카드 사용 계수, 7회 해금, 합체 가능 판정·결합, 전투 한 틱, 보상 정산, 강화 |
| `src/game/robot-engine.test.ts` | `node --test` 단위 테스트 |
| `src/components/hyunjun/useRobotWorld.ts` | 월드 안 로봇 위치·가까운 로봇·탑승·전투 진행 훅 |
| `src/components/hyunjun/RobotWorld.tsx` | 마을 위에 로봇·악당을 그린다 |
| `src/components/hyunjun/RobotControls.tsx` | 오른쪽 맥락 버튼(만나기·타기·카드·공격·합체) |
| `src/components/hyunjun/RobotSpeciesArt.tsx` | 신규 로봇 SVG(바이저·램프 눈, 사람 얼굴 아님) |
| `scripts/verify-robot-world.cjs` | 헤드리스 Chromium으로 5분 시나리오 자동 확인 |

탑승 중 이동은 기존 플레이어 좌표와 이동 함수를 그대로 쓴다. 차량·실내에 있을 때는 로봇 탑승을 막고, 지도로 이동하면 탑승을 풀어 준다(실내 기능과 같은 규칙).

탈것 상태를 하나의 모드 reducer로 합치는 정리는 이 작업과 별개 설계 결정으로 다룬다. 로봇 작업이 `Village.tsx`를 더 키우지 않도록 위 분리를 먼저 지킨다.

## 3. 저장 형식 — 꼭 지킬 것

- **FACT · 위험:** `world-model.ts:225`, `:235`, `:307`이 `raw["version"] === 3`일 때만 구매한 자동차·업그레이드를 그대로 읽는다. 버전 숫자만 4로 올리면 **다음 로드에서 산 자동차가 사라지거나 별코인이 다시 환급**된다.
- **PR-A 결정:** 로봇 진행도는 `robots` 칸으로 추가하고 **버전 숫자는 3 그대로** 둔다. `migrateSave`가 빠진 칸을 기본값으로 채우므로 옛 저장은 그대로 읽힌다. 왕복 테스트(`src/game/robot-engine.test.ts`)로 자동차·업그레이드·별코인이 그대로인 것을 확인한다.
- **PROPOSED (나중에 버전을 꼭 올려야 할 때):** 버전을 올릴 때는 "옛 형식(v1·v2) → v3 변환"과 "v3 이상 판독"을 분리한다. v3 저장을 v4로 읽고 다시 저장·로드해도 별코인·자동차·집이 그대로인지 왕복 테스트를 먼저 쓴다. 저장 키(`hyunjun-game-v2`)는 바꾸지 않는다(L-05).
- 저장에는 **id와 진행도만** 넣는다: 가진 로봇 id·등급, 카드별 사용 횟수, 재료 개수, 합체 레벨, 희망 별. 좌표·애니메이션·합체 트리는 넣지 않는다(지금은 상태가 바뀔 때마다 JSON 전체를 저장한다).

## 4. 데이터 타입 초안 (PROPOSED)

```ts
type Grade = "일반" | "강화" | "강철" | "황금" | "다이아" | "궁극";
type RobotSpecies = { id: string; family: string; artKey: string; parts: string[]; skills: string[] };
type OwnedRobot = { speciesId: string; grade: Grade; hope: number }; // hope = 희망 별
type Card = { speciesId: string; uses: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; unlocked: boolean };
type Fusion = { memberIds: string[]; level: number }; // 2·3은 대수, 4 이상은 게이지
type Villain = { id: string; boss: boolean; hp: number; phase: "active" | "disabled" | "retreating" };
```

**지켜야 할 규칙 (테스트로 확인):**
1. 전투 중 유효한 카드 사용만 센다. 7에서 멈추고 해금 보상은 **딱 한 번**.
2. 같은 로봇을 합체에 두 번 넣을 수 없다.
3. 강화 실패 시 로봇·재료를 잃지 않는다. 희망 별 2개면 다음 강화는 성공. 난수는 주입 가능하게 해서 테스트에서 고정한다.
4. 악당 격파 보상은 한 번만 정산한다(기존 중복 정산 방지 방식과 같게).

## 5. 가족방(멀티플레이)

1차의 로봇·카드·전투·보상은 **각 기기 로컬 전용**이다. 가족방은 지금처럼 플레이어 위치만 주고받는다. 함께 싸우기는 보상 합의·권한 문제가 있으므로 별도 설계로 미룬다. 탑승 중인 로봇 모습을 가족에게 보여 주는 것은 2차 후보.

## 6. PR 나누기 (PROPOSED)

| PR | 범위 | 완료 확인 |
|---|---|---|
| PR-A | 저장 `robots` 칸(버전 유지, 왕복 테스트) + 카탈로그(돌아다니는 3종 + 7회로 열리는 3종) + 엔진(카드 7회·해금) + 마을에서 만나기·타기 + 연습 로봇에 카드 쓰기 + `verify-robot-world.cjs` | RB-01~05, RB-09, RB-11 |
| PR-B | 연습 로봇 자리에 악당 1종 + 월드 안 전투 + 2·3단 합체 + 재료·강화(항상 성공) | RB-06~08, RB-10, 5분 시나리오 |

PR-A에는 아직 악당이 없어서, 카드 횟수를 셀 상대로 **가만히 서 있는 연습 로봇**을 둔다. 연습 로봇은 체력·전투가 없고, PR-B의 악당 로봇 자리가 된다.

24종·보스·황금 강철 지역은 2차 PR로 넘긴다.

## 7. 검증 계획

- **단위 테스트:** 6→7→재사용, 해금·보상 중복 없음, 불가능한 합체 거부, 강화 실패 무손실·보장, v3→v4 왕복 시 자동차·별코인 보존.
- **브라우저:** `verify-building-interiors.cjs`와 같은 방식(격리된 저장, 헤드리스 Chromium, 390×844·1280×900, 스크린샷·런타임 오류 수집). 기존 스크립트들은 키보드로 움직이므로, 로봇 검증에는 **조이스틱 터치 이동 + 오른쪽 버튼 동시 누르기**를 추가한다.
- **성능:** 로봇을 한꺼번에 다 움직이지 않는다. 화면 주변의 로봇만 활성화하고 수를 제한한다. 휴대폰 크기에서 프레임 측정을 기존 성능 검사(`verify-family-performance.cjs`) 방식으로 남긴다.
- **실기기:** 삼성 브라우저·S Pen·현준이 직접 플레이는 NOT_RUN으로 따로 적는다.
