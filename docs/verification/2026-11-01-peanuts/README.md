# 박현준 땅콩 톡톡 검증 (2026-11-01, PR #44)

- 대상: 미니게임 `mn-08`, 앱 경로 `/peanuts`, Pages 주소 `#/peanuts`. 2·3·4조각 순서를 60초 안에 맞춰 땅콩 8개를 꺼낸다.
- 규칙: 3번 틀리거나 시간이 끝나면 종료. 일시정지·탭 숨김에서 시간 정지. 끝난 판만 1회 정산(점수당 4별코인 + 완료 보너스). 중간에 나가거나 새로고침하면 보상 없음, 기존 자산은 줄지 않는다.
- 코드: `src/game/peanut-engine.ts`(+테스트), `src/components/hyunjun/PeanutGame.tsx`, 저장은 `miniBest.peanuts` 기본값 0만 추가(키 `hyunjun-game-v2`, version 3 유지).
- 검증 스크립트: `scripts/verify-peanuts.cjs` (폭 360·390·1280) + 허브 회귀 `verify-kart-hub.cjs`.
- 결과: [results.json](results.json) — 모두 PASS. 단위 테스트 161/161.
- 화면: [시작 360](intro-360.png) · [진행 360](playing-360.png) · [진행 390](playing-390.png) · [성공 1280](won-1280.png)
- NOT_RUN: 삼성 브라우저·S Pen·현준이 실기기 확인.
