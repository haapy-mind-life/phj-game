# 걸어 다니는 온실 검증 (2026-11-01, PR #46)

- 대상: 큰 게임 `lg-08`, 기존 경로 `/greenhouse`(Pages `#/greenhouse`)를 걸어 다니는 화면으로 바꿨다. 이 변경으로 목록 상태가 기존 연결에서 플레이 가능으로 바뀌었다.
- 규칙: 밭 버튼은 고르기만 하고, 심기·물 주기·수확은 밭에서 82 이내로 걸어가야 된다. 밭 6개, 작물 종류·가격, 물, 황금 작물, 수확 배수 1.5는 기존 그대로다.
- 코드: `src/game/greenhouse.ts`(+테스트), `src/components/hyunjun/Farm.tsx`, `greenhouse.css`. 저장 형식과 reducer는 바꾸지 않았다(키 `hyunjun-game-v2`, version 3 유지).
- 검증 스크립트: `scripts/verify-greenhouse.cjs` (폭 360·390·1280) + 회귀 `verify-kart-hub.cjs`.
- 결과: [results.json](results.json) — 모두 PASS. 단위 테스트 170/170.
- 화면: [도착 360](arrival-360.png) · [도착 1280](arrival-1280.png) · [물 주기 390](watering-390.png)
- NOT_RUN: 삼성 브라우저·S Pen·현준이 실기기 확인.
