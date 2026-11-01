# 02. 현재 코드·배포 실사 (AS-IS)

> FACT는 2026-10-11 `main` `7fd147ad8d46aebe3075368b10271c67cd62b0eb`의 실제 파일을 읽고 확인한 내용이다. 이후 코드가 변경되면 재검증해야 한다.

## 코드 근거 지도

| 영역 | 코드 위치 | 확인된 사실 | 이번 요청의 부족한 부분 |
| --- | --- | --- | --- |
| 월드/충돌/카메라 | `src/game/adventure.ts` | `MAP={width:5600,height:1800}`; 가로 wrap / 세로 clamp; `BLOCKS`; `stepPlayer` / `cameraAt`; `PORTALS` | 큰 바다·해변/해저 월드 모델 없음; 현재 영역만 고정 |
| 마을/플레이어 | `src/components/hyunjun/Village.tsx` | 실제 위치, 조이스틱, NPC, 맵, 차량 탑승, 사건, 캠핑, 호수 잠수 관리; 위치는 React 상태 및 일부 모듈 변수 | 월드 스트리밍/복수 지역 이동 추상화, 복합 상호작용 슬롯 없음 |
| 기존 하우스 | `src/components/hyunjun/House.tsx` | 별도 집 페이지, 6개 가구 슬롯, 벽지/옷 | 월드 내 큰 집, 실제 집 내부 이동, 음식 들기/먹기 없음 |
| 차량 | `src/game/cars.ts`, `CarArt.tsx`, `Garage.tsx` | 10차종×10색 = 100개 ID; 20개씩 선택; 지역 이동시 차량 비주얼 | 잠수함·푸드트럭 차종 없음, 차량 간 기능/충돌/속도 동작 분리 미흡 |
| 마을 친구 | `src/game/villages.ts`, `FriendArt.tsx` | 10개 마을과 각기 다른 SVG 친구 | 아빠 로봇 동료 AI/추적/대화 없음 |
| 구조 신고 | `src/game/world-events.ts`, `WorldScenes.tsx`, `siren.ts` | 신고 4종, 출동, 현장 액션, 호수 경계, 캠핑장·경로 표시, 브라우저 짧은 사이렌 | 바다와 별도 해저 탐험 없음; 기존 신고/탑승 상태와 중첩 리스크 |
| 재화·농장 | `src/lib/world-model.ts` | `GameState.version=2`, `money` 별코인, 작물 판매/러너 보상/가구 구매, 입력 검증 | 푸드트럭 주문·판매·재고·거래 기록·음식 소지 필드 없음 |
| 저장 | `src/lib/world-store.ts` | `hyunjun-game-v2` localStorage, 이전 저장 마이그레이션, 저장 실패 경고 | 신규 활동 정보에 대한 저장 계약/중복 거래 방어 설계 필요 |
| 차량 선택 저장 | `src/components/hyunjun/Garage.tsx` | 별도 `hyunjun-selected-car-v1` localStorage | 잠수함/푸드트럭 등 차량 유형 확장시 ID 호환 설계 필요 |
| 입력 | `Joystick.tsx`, `useMovement.tsx`, `adventure.css` | 왼쪽 터치 조이스틱·오른쪽 액션, pointer/touch fallback | 실기기에서 수중·장사·집 상호작용 간 조작 상태 충돌 확인 필요 |
| 호스팅 | `src/pages-entry.tsx`, `vite.pages.config.ts`, `.github/workflows/pages.yml` | 별도 정적 번들/해시 라우터; PR에서 빌드만, `main`에서 Pages 배포 | 새 루트/대용량 이미지/월드 데이터 도입 시 경로·번들 성능 검증 필요 |

## 실제 배포 검증

- 기존 기능 병합 `PR #13`, `main` SHA `7fd147a`.
- [해당 SHA GitHub Actions](https://github.com/haapy-mind-life/carrot-racer-farm/actions/runs/38105386742): `build-and-verify` 및 `deploy` 성공.
- 확인된 것은 **정적 번들 생성과 배포 작업 성공**이다. 실사용자의 화면/사운드/펜 터치 반응 또는 서버의 실질적인 응답 체감까지 자동으로 증명하지 않는다.
- GitHub Pages는 정적 호스팅. **로그인·원격 DB·실시간 서비스 서버는 없다**는 것을 신규 기능 설계의 기본 제약으로 유지한다.
- 저장은 도메인(origin)별로 독립적이다. Lovable의 기존 진행 기록은 GitHub Pages로 자동 이전되지 않는다.

## 재활용하면 좋은 것 (PROPOSED)

- 공통 조이스틱과 왼쪽 이동/오른쪽 맥락 액션.
- `GameState.money`와 reducer 기반 지갑.
- SVG 기반 가벼운 그래픽 아트(긴 로딩 없이 표시).
- 월드 포털/근접 거리 판별 및 사건의 월드 내 위치 표시 방식.
- GitHub Actions PR 검증/메인 배포 절차, 이전 저장 방어적 마이그레이션 테스트.

## 해결해야 할 기술 부채 / 리스크 (FACT + 위험 해석)

1. **대형 맵 확대:** 이미 5600×1800 전체를 `adv-map`/SVG로 다루므로 바다 확장 시 DOM/SVG 비용, 렌더링, 큰 이미지 메모리가 커질 수 있다.
2. **월드와 집 경험 단절:** 기존 `/house`는 페이지 전환형이어서 현준이의 '월드 안에서 생활'이라는 최신 요구와 구조가 다르다. 삭제가 아니라 **양립/마이그레이션** 접근이 필요하다.
3. **차량 상태 단순화:** 현재 차량은 월드에서 표시되는 기존 이동 동작 기반; 부력·수심·상점 개점·대형차 차체 충돌 같은 실제 차량 전용 행위는 없다.
4. **돈 지급 중복/데이터 손상:** 푸드트럭 거래는 신규 소스이므로, 잘못 설계하면 연속 탭/리렌더/저장 실패로 보상 중복이 발생할 수 있다.
5. **일부 월드 세션 상태 비영속:** 호출 단계·잠수·캠핑은 현재 `Village.tsx`의 컴포넌트 상태. 어떤 신규 진행 기록을 보존할지 결정이 필요하다.
6. **호수와 바다 혼동 주의:** 현재 `LAKE`는 (1740~2390,710~1020) 부근이다. 이것을 '큰 바다/잠수함 추가 완료'라고 설명하지 않는다.
7. **어린이 사용성:** 조이스틱·폰 화면 검증 문서는 있으나 삼성 브라우저·S Pen 실사용 검증은 별도다.

## 기술 검토를 위한 관찰 지점

- `src/game/adventure.test.ts`: 월드 이동·충돌 경계 회귀.
- `src/game/world-events.test.ts`: 사건/호수/캠핑 회귀.
- `src/game/cars.test.ts`: 자동차 ID/100종 정합성.
- `src/lib/world-model.test.ts` + `world-store.test.ts`: 보상·세이브 마이그레이션·저장 실패.
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run build:pages`가 이후 PR 기본 게이트.

이 문서의 문장과 초기 `docs/archive/PROJECT_STATUS_2026-10-11.md`가 충돌할 경우, **최신 `main` 코드/Actions 증거를 먼저** 확인한다.

