# 로컬 Claude Code / Codex 전달용 구현 프롬프트 — phj-game 로봇 감사 및 추가 v1.0

> 이 문서를 **전체 읽고 실행**하라. 사용자는 "로봇 추가 요청이 적용되지 않은 듯하다"는 문제를 제기했다. 이 PR은 설계·콘셉트 인계 PR이며, 이미지와 이 문서를 실제 게임 기능 구현 완료로 오해하면 안 된다.

## 목표

원격 `haapy-mind-life/phj-game`의 최신 상태를 독립 worktree에서 조사하여 **블루카비·황금 칼드케이트 미구현 여부를 코드/화면/테스트로 감사**하고, 현재 확정된 계약을 지키는 범위에서 **오리지널 캐릭터 외형과 시계/월드용 로봇 데이터·시각적 에셋을 실제 게임에 반영**하라. 각 캐릭터의 전신 및 변신 형태(블루카비 경찰차, 황금 칼드케이트 로봇·경찰차·레이싱카·구급차·소방차·비행기·전투기·배·잠수함) 상세 그림을 준비하라. 현재 합체/화폐/저장/전설 개수와 충돌하는 미결정 사항은 무단 구현하지 말고 사용자 결정 게이트로 보고하라. 테스트와 시각 검증을 마친 뒤 **별도 구현 PR**을 올려라. 본 인계 PR을 임의로 기능 구현 PR로 재정의하지 않는다.

## 현재 라이브 FACT (2026-11-08 확인, 작업 직전 재검증)

- 저장소: `https://github.com/haapy-mind-life/phj-game`
- Pages: `https://haapy-mind-life.github.io/phj-game/` (base `/phj-game/`).
- 원격 main 조사 시점 SHA: `e6aef0f447d49f0e9bb0c6c2029d5401eae9772e` — 작업 직전 `git fetch origin` 후 다시 확인.
- PR #53 (시작 화면/로딩/준비 중 장소) **병합**, PR #51 (티라/엠블러스) **병합**, PR #42 (로봇 100대) **병합**.
- 기존 `src/components/hyunjun/WorldEntry.tsx`는 `rb-thunder-police`를 시작 화면 로봇으로 사용한다. 이를 블루카비 구현 완료로 간주하지 말 것.
- `src/game/robot/robot-catalog.ts`에는 `rb-tira`, `rb-emblus`가 있으며 현재 로봇 종 14, 주요 6, 전설 6이다. 블루카비·칼드케이트 종 ID는 없다.
- `src/game/robot/robot-forms.ts`는 `robot|egg|ambulance` 변신 상태만 지원한다.
- 군단 `src/game/robot/robot-army.ts`: 100개의 고유 `instanceId`, `army-008=rb-emblus`, `army-010=rb-tira`.
- `src/components/hyunjun/RobotWatch.tsx`에는 티라/엠블러스 전용 특수합체 블로킹 로직이 있고, `robot-engine.ts`의 `validFusion`이 룰을 적용한다.
- 영구 저장은 `hyunjun-game-v2`, `GameState.version=3`이며 7회 카드 사용 및 정비소 강철 강화 체계가 있다.
- 로봇 기지는 `src/game/world/adventure.ts`에서 `planned`. 아직 실제 독립 게임이 아니다.

## 먼저 읽을 정본

1. `AGENTS.md` — 다른 에이전트 작업 보호, 커밋 전 `npm run check`, domain별 pure function/test.
2. `MEMORY.md`, `docs/README.md`.
3. `docs/robot-fusion/2026-11-02-roster-100/README.md` + 그 폴더의 엠블러스/티라 시안과 테스트 근거.
4. `docs/world-expansion/2026-11-07-world-entry/README.md`의 D-1..D-8.
5. **`docs/robot-fusion/2026-11-08-blue-gold/README.md`와 두 오리지널 SVG**
   - `images/bluecabi-concept.svg` : 블루카비 원화/차량 참고
   - `images/golden-kaldkeite-9-forms.svg` : 칼드케이트 전신 및 9형태 시안

## 로컬 작업 및 PR 생성 절차

1. `git status --short`, `git branch --show-current`, `git remote -v`로 로컬 작업을 조사한다. 다른 에이전트 변경물은 손대거나 stash하지 않는다.
2. `git fetch origin` 후 main SHA, 현재 PR/브랜치 상태, 이미 반영된 로봇 구현을 검증한다.
3. 인계 PR의 문서와 SVG가 main에 병합되기 전이라면 **이 브랜치의 최신 커밋을 참고**하되, 코드 구현 PR은 최신 `origin/main`에서 새 worktree와 새 브랜치를 만들어 작업한다. 필요하면 인계용 이미지·문서만 안전하게 가져온다.
4. 브랜치: `feat/robot-blue-gold-implementation-YYYYMMDD` 형태. 기존 `feat/robot-watch-fusion-20261101`은 오래된 미병합 종료 브랜치이므로 그대로 기반으로 삼지 않는다.
5. 현재 코드·테스트 기반선 기록 → 상세 디자인/데이터 구현 → 테스트 → 본인 브랜치 push → Draft PR 생성. 보호자 승인 전 main 병합 금지.

## 이 프롬프트의 구현 구획

### 1) FACT / REQUEST / DECISION REQUIRED를 분리한 구현 감사

다음 요소가 이미 실제 코드/화면에 있는지 파일/라인 증거로 보고:
- 신규 로봇 고유 ID, 카탈로그, 현재 시계 카드, 월드 소환, 변신 상태, 실제 전신 도형, 공격/합체/성장, 저장 데이터, 테스트 및 스크린샷.
- 임시 기존 경찰 그림을 블루카비로 잘못 표시하고 있지 않은지.
- 엠블러스의 기존 승인 에셋과 새로운 이름/변신 그림 간 충돌.
- 기존 시작 화면·월드 입구·30개 마을/가족방/미니게임이 유지되는지.

### 2) 로봇 데이터와 에셋의 구체적 구현

**블루카비**
- 내부 작업명 `블루카비`, 설명형 표시 이름 예 `푸른 번개 경찰 로봇`.
- 기존 `rb-thunder-police`와 구별되는 신규 캐릭터. 중복 ID·덮어쓰기 금지.
- 비인간형 뾰족한 헬멧/바이저, 작은 양쪽 사이렌 2개, 번개 표식, 경찰 모자 구조. 청색·하늘색·은색 위주, 작은 돌출 날개, 구불거리지 않는 다리.
- 경찰차 변신 도형, 전신 정면과 3/4, 월드 축소 도형, 시계 카드용 얼굴·전신, 그림 식별용 semantic data attrs/ARIA label.
- 기존 프로젝트의 SVG/TSX 렌더링 패턴을 따라 PC/휴대폰 화면에서 읽히도록 구현. 대표 콘셉트 SVG는 실제 게임 에셋이 아니라 상세 스타일 레퍼런스다.

**황금 칼드케이트**
- 작업명 `황금 칼드케이트`, 설명형 표시 이름 예 `초황금 다중 변신 로봇`.
- 기존 전설 6종과 명확하게 다른 금빛 메카. 머리는 쐐기형, 큰 금속 장갑/가슴 중앙 전기 코어, 날개는 실제 조작시 가리는 큰 장식이 아닌 작은 사이드 패널.
- 로봇과 경찰차, 레이싱카, 구급차, 소방차, 비행기, 전투기, 배, 잠수함 형태 모두 서로 혼동되지 않는 개별 실루엣 원화/TSX 컴포넌트 준비. 각 모습에 독립된 라벨, 일관된 황금/푸른 전기 스타일. 엠블러스의 구급차 얼굴/실루엣을 그대로 복제하지 않는다.
- **시각적 9형태를 준비하는 것과 실제 게임 능력/변신 시스템 9종을 활성화하는 것은 별개**다. 실제 변신 제어, 9형태 로직, 신규 등급/해금은 보호자 승인 없이는 비활성 설계로 두고, 표시용 사전 미리보기 등 안전한 범위만 구현한다.

**엠블러스 (기존 유지)**
- `rb-emblus` 기존 색·얼굴·구급차 변신/미스트 해독·7회 강화·티라 합체를 보존.
- 참조: `docs/robot-fusion/2026-11-02-roster-100/images/sheet-emblus.png`, `sheet-special-fusion.png`, `phone-05-ambulance.png`.
- 칼드케이트-엠블러스의 새 합체는 아직 결정 필요. 먼저 existing rule과 새 proposal의 영향 분석/테스트 케이스만 작성한다.

**데이터 통합**
- `robot-catalog.ts`/기존 UI를 재사용. 새 별도 registry나 덮어쓰기용 catalog를 만들지 않는다.
- 현재 FEATURED_MAIN 6종 / 전설 6종 / 군단 100대에 의존하는 테스트를 조사하고, 새 두 캐릭터를 어디에 보여줄지 **정책 결정을 거치기 전 기존 숫자를 임의 변경하지 않는다**.
- 새 ID와 일러스트를 어떤 방식으로 추가할지 제안하고, 이미 승인 가능한 비파괴 범위(컨셉 미리보기/독립 프리뷰 컴포넌트)는 먼저 구현한다.
- 확정된 조건 없는 상호작용을 `playable`로 허위 등록하지 않는다.
- 게임 시작 화면에 새 로봇을 쓰려면 실제 구현·렌더러 검증 후 기존 `rb-thunder-police` 대체를 제안한다. 기존 시작 화면 기능은 보존한다.

### 3) 승인 없는 상태 변경 금지

- **D-1 합체**: 엠블러스는 지금 티라와만 특수합체. 일반 합체 불참. 블루카비/칼드케이트와 합체시키지 않는다.
- **D-2 황금 전기**: 현행 별코인을 변경하거나 황금 전기를 실제 신규 화폐로 만들지 않는다.
- **D-3 성장**: 기존 7회 카드 사용·정비소 강철을 보존. 동시 레벨업 구현 금지.
- **D-4 저장**: `hyunjun-game-v2`/version 3 유지. 신규 지속 필드/마이그레이션은 설계·승인 후.
- **D-5 이름**: 신규 이름은 workName, 실제 표시명은 설명형·비침해로. 기존 14종 이름 변경 금지.
- **D-6 목록**: `/kart` 40개(큰20+미니20) 유지. 신규 모드에 임의 route 추가하지 않음.
- **D-7 개인정보**: 공개 저장소, 아동의 개인 이미지·음성·연락처 등 올리지 말 것.
- **D-8 디자인**: 위 오리지널 콘셉트를 시안으로 보고 보호자 승인 전 정식 출시 에셋으로 확정하지 않는다.

## 관련 코드 파일(재검증 필수)

`src/game/robot/robot-catalog.ts`, `robot-forms.ts`, `robot-engine.ts`, `robot-roster.test.ts`, `robot-army.ts`, `src/components/hyunjun/RobotPortrait.tsx`, `RobotRosterArt.tsx`, `RobotWatch.tsx`, `useRobotWorld.ts`, `WorldEntry.tsx`, `src/game/world/adventure.ts`, `src/lib/world-model.ts`.

특히 `Village.tsx`는 connector로 유지. 새 대형 UI·로봇 드로잉을 이 파일에 직접 쌓지 않는다. 게임 규칙은 src/game/robot의 순수 함수 + 이웃 테스트로 분리한다.

## 필수 테스트

- 코드/종/카드/해금/저장 정상화, 14종·100대·6전설 기존 동작·엠블러스 특수합체/해독/티라, 실수로 교체된 이전 ID 없는지.
- 새 로봇 전신·변신 도형 360x740, 390x844, 태블릿 해상도 시계/월드 축소 46px·86px·150px·실제 월드 크기.
- 렌더러에서 로봇 ID/폼과 일러스트 매칭 및 이미지 겹침/잘림 확인.
- 시작 화면 → 로딩 → 월드, 해시 직접 진입, 로봇 시계/월드 복귀 회귀.
- 명령: `npm run check`, `npm run build`, `npm run build:pages`, `node scripts/verify-robot-roster.cjs`, `node scripts/verify-robot-army.cjs`, `node scripts/verify-world-entry.cjs`. 실제 수행 성공/실패/NOT_RUN 명시.
- 휴대폰 삼성 인터넷·S Pen·현준이 직접 플레이는 실기기 확인 전 NOT_RUN. CI PASS가 실기기 PASS가 아니다.

## 최종 산출물

1. 코드 구현 PR (기존 기능 파괴 없이)
2. 각 로봇 설명형 표시명/작업명/색상/외형/각 변신 형태/에셋·TSX 명세
3. 원본 시안과 실제 구현 스크린샷의 차이표
4. 기존 엠블러스/티라/전설/군단 저장 계약 회귀 테스트 결과
5. 보호자 결정 목록 R-01~R-08, 현재 선택·미승인 상태
6. 테스트 및 모바일 미검증 분리, CI/Pages 배포 결과
7. PR 링크, branch, SHA, 변경 파일 목록, 정확히 다음 3개 작업

> 마감 조건: **새 로봇이 '문서상 있는 것'과 '게임에서 실제로 선택·보이고 동작하는 것'을 혼동하지 않으며, 기존 로봇·월드·저장 구조를 지키고 재현 가능한 증거를 남기는 것.**
