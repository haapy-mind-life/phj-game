# 박현준 방 깨기 검증 (2026-11-01, PR #45)

- 대상: 큰 게임 `lg-11`, 앱 경로 `/rooms`, Pages 주소 `#/rooms`. 걸어서 푸는 방 3개(열쇠 찾기, 상자 밀어 발판 누르기, 때맞춰 빛의 다리 건너기).
- 규칙: 지금 방 다시 하기와 일시정지가 있다. 세 방을 모두 끝내야 40별코인을 1회 정산한다. 중간에 나가거나 새로고침하면 첫 방부터 다시 시작하고 보상은 없다.
- 코드: `src/game/room-escape.ts`(+테스트), `src/components/hyunjun/RoomEscape.tsx`, `rooms.css`. 저장은 `roomEscapeBest` 기본값 0만 추가(키 `hyunjun-game-v2`, version 3 유지).
- 검증 스크립트: `scripts/verify-room-escape.cjs` (폭 360·390·1280) + 회귀 `verify-kart-hub.cjs`, `verify-peanuts.cjs`.
- 결과: [results.json](results.json) — 모두 PASS. 단위 테스트 167/167.
- 화면: [열쇠 360](key-360.png) · [상자 390](crate-390.png) · [다리 390](bridge-390.png) · [성공 1280](won-1280.png)
- NOT_RUN: 삼성 브라우저·S Pen·현준이 실기기 확인.
