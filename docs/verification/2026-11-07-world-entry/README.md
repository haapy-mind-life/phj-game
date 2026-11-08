# 시작 화면·월드 진입 검증 (2026-11-07)

- 대상: 루트 `/`(Pages `#/`)의 시작 화면 → 로딩 → 기존 월드, 준비 중 장소 6곳. 설계와 결정 항목은 [world-expansion/2026-11-07-world-entry](../../world-expansion/2026-11-07-world-entry/README.md).
- 기준: `origin/main` `6532c71`, 브랜치 `feat/hyunjun-world-entry-20261107`.
- 검증 스크립트: `scripts/verify-world-entry.cjs` — Pages 빌드(`npm run build:pages`)를 `/phj-game/` 하위 경로로 미리보기해서 실행. 폭 360·390(터치 조이스틱), 844×390 가로(터치), 1280(키보드).
- 결과: [results.json](results.json)

| 수락 항목 | 결과 | 근거 |
|---|---|---|
| 첫 루트 접속 시 시작 화면 | PASS | 4개 화면 크기, [시작 390](title-390.png) · [가로 844](title-844.png) |
| 시작 버튼 동작, 두 번 눌러도 한 번만 진입 | PASS | 월드 코드 요청 1회, 월드 1개 |
| 로딩 애니메이션 표시 후 실제 로딩 성공 시 월드 | PASS | [로딩 390](loading-390.png) |
| 로딩 실패 → 「다시 가기」 → 월드 | PASS | 월드 코드 요청을 막아 실패 재현, [실패 390](failed-390.png) |
| 터치 조이스틱·키보드 이동 | PASS | 360·390·844 터치, 1280 키보드 |
| 준비 중 장소: 안내만, 주소·저장 그대로 | PASS | 6곳 모두 걸어가서 「이름 · 준비 중」 확인, 주소·저장 그대로, 집·러너 그림과 겹침 없음(390). [개구리 코인별 390](planned-390.png) |
| 월드 → 러너 → 월드, 시작 화면 다시 안 나옴 | PASS | 360·390·1280, 러너 입구로 걸어가서 진입 |
| 월드 → `/house` → 월드, 시작 화면 다시 안 나옴 | PASS | 360·390·1280. 집 문은 걸어 들어가는 집 안이고 `/house`(가구)는 그 안의 버튼이라, 검사는 앱 안에서 경로만 바꾼 뒤 「마을로 돌아가기」를 누른다 |
| `#/race` 바로 열기 → 러너 즉시, 이후 월드에서 시작 화면 없음 | PASS | 러너는 월드 코드를 기다리지 않음. 돌아올 때 로딩 카드는 제목 글씨 없이 나온다 |
| 뒤로/앞으로 가기 | PASS | 러너 ↔ 월드 |
| 새로고침 → 시작 화면 다시 (저장하지 않음) | PASS | |
| 저장 유지 (`hyunjun-game-v2`, version 3) | PASS | 별코인·차량·러너 기록 동일 |
| 가로 스크롤 없음 | PASS | 4개 화면 크기 |

## 기존 기능 회귀 (같은 Pages 빌드, 2026-11-08 실행)

시작 화면이 생기면서 루트를 여는 기존 검사 9개가 시작 버튼을 누르도록 `scripts/enter-world.cjs`를 추가했다(제품 코드에 테스트용 우회 없음).

| 검사 | 결과 |
|---|---|
| `verify-kart-hub` · `verify-robot-army` · `verify-child-play` · `verify-robot-roster` · `verify-greenhouse` · `verify-robot-world` · `verify-building-interiors` · `verify-living-world` · `verify-peanuts` · `verify-room-escape` | PASS |
| `verify-scene-polish` · `verify-supabase-family` | PASS — 로컬 계약 서버(`scripts/family-supabase-fixture.ts`)와 그 주소로 만든 시험용 빌드에서 실행. 시험용 빌드는 배포·커밋하지 않음 |
| `verify-family-performance` | FAIL (환경) — 4배 CPU 감속에서 이동 중 15fps 기준 미달. 바꾸지 않은 `origin/main` 빌드도 같은 PC에서 10.3·11.8fps로 같이 미달(이번 변경 9.1·10.6fps). 이번 변경과 무관한 이 PC의 성능 한계로 판단 |

## 그 밖의 확인

- TanStack 앱(`npm run dev`): 서버가 시작 화면을 그려 보내고, 브라우저 콘솔 경고·오류 0(하이드레이션 경고 없음). 시작 → 월드, `/race`로 열기 → 「마을로 돌아가기」 → 시작 화면 없이 월드.
- `npm run check`: 단위 테스트 201/201, 타입 검사, 린트(오류 0, 기존 경고 8 그대로), 문서 링크.
- 이 PC에서 멈추던 `src/lib/family-permissions.test.ts`도 이번 실행에서는 통과했다(201에 포함).
- `npm run build`, `npm run build:pages` 성공. 첫 화면 JS 880kB → 626kB, 월드 코드 262kB는 시작 버튼 후에 받는다. CSS는 기준선과 비교해 새 `.we-*` 규칙 외 차이 없음.
- 배포 경로: 모든 검사는 `/phj-game/` 하위 경로 미리보기에서 실행. 실제 GitHub Pages 배포는 병합 전이라 NOT_RUN.

## NOT_RUN

- 삼성 브라우저·S Pen·현준이 실기기 UAT, iOS Safari.
- 공개 Pages 주소에서의 실행(병합·배포 후).
