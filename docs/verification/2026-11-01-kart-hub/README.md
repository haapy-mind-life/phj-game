# 카트 허브 검증 (2026-11-01, PR #43)

- 대상: `/kart` 허브(앱 경로 `/kart`, Pages 주소 `#/kart`). 큰 게임 20 + 미니게임 20 목록, 필터, 가로 스와이프, 월드·러너 시작, 집·농장 연결.
- 상태 표시: 플레이 가능 / 기존 기능 연결 / 준비 중(실행 경로 없음). 목록 정의는 `src/game/kart-catalog.ts`.
- 검증 스크립트: `scripts/verify-kart-hub.cjs` (headless Chromium, 폭 360·390·1280).
- 결과: [results.json](results.json) — 세 폭 모두 PASS(월드 이동·위치 복귀·저장 보존·뒤로/앞으로/새로고침). 단위 테스트 156/156, 타입·빌드 PASS.
- 화면: [360](hub-360.png) · [390](hub-390.png) · [1280](hub-1280.png) · [월드 복귀 360](world-360.png)
- NOT_RUN: 삼성 브라우저·S Pen·현준이 실기기 확인.
