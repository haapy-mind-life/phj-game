# 박현준 게임 문서 안내

이 폴더는 실제 코드에 대한 기록과 미래 요구사항을 **별도의 상태**로 관리한다.
새 에이전트는 루트 [MEMORY.md](../MEMORY.md) → 이 문서 → 아래 "최신" 항목 순으로 읽는다.

## 표기 규칙

- 문서는 **FACT(코드/CI 증거) / REQUEST(사용자 요구) / PROPOSED(설계안) / UNKNOWN(미결정) / NOT_RUN(실행 못 한 검증)** 을 구분한다.
- 요구사항 변경은 번호가 있는 등록부와 결정 장부에 반영한다.
- 아동 게임의 안전, 개인정보 보호, 실제 결제 배제, 조작 접근성을 우선한다.
- 스크린샷은 문서가 링크하는 것만 커밋한다(AGENTS.md 참고).

## 최신 (새 것이 위)

| 날짜 | 상태 | 문서 | 내용 |
|---|---|---|---|
| 2026-11-01 | 구현, 병합 전 (PR #47) | [검사 스크립트](../scripts/verify-robot-army.cjs) | 시계 ⭐ 전설 탭에 못 찾은 전설 로봇의 위치 힌트 표시 |
| 2026-11-01 | 구현 (PR #46) | [걸어 다니는 온실 검증](verification/2026-11-01-greenhouse/README.md) | 온실을 걸어 다니며 돌봄. 저장 형식 변경 없음. 이후 목록 40개 중 플레이 가능 5, 기존 연결 1, 준비 중 34 |
| 2026-11-01 | 구현 (PR #45) | [방 깨기 검증](verification/2026-11-01-rooms/README.md) | 큰 게임 `lg-11`. 걸어서 푸는 방 3개, 완료 시 40별코인 1회 정산 |
| 2026-11-01 | 구현 (PR #44) | [땅콩 톡톡 검증](verification/2026-11-01-peanuts/README.md) | 카트 허브 첫 신규 미니게임 `mn-08`. 정산 1회·중도 이탈 무보상. |
| 2026-11-01 | 구현 (PR #43) | [카트 허브 검증](verification/2026-11-01-kart-hub/README.md) | `/kart` 게임 목록 40개(당시 플레이 가능 2: 월드·러너, 기존 연결 2, 준비 중 36) |
| 2026-11-01 | 구현 (PR #42) | [로봇 군단 v3](robot-fusion/2026-11-01-robot-army-v3/README.md) | 100대 군단, 전설 6종, 100대 합체, 거대 로봇 전투 |
| 2026-11-01 | 구현 (PR #41) | (MEMORY.md 기록) | 소환한 로봇은 탄 상태로 시작 |
| 2026-11-01 | 구현 (PR #37·#40) | [로봇 소환 시계 통합](robot-fusion/2026-11-01-watch-integration/README.md) | 시계 소환, 한 몸 2·3단 합체, 무기, 임무, 7회 강화. 실기기 NOT_RUN |
| 2026-10-31 | 기획 (PR #36) | [슈퍼 로봇 합체 월드 v1.0](robot-fusion/2026-10-31-v1.0/README.md) | 현준이 구술 요구 원문, 요구사항 ID, 구현 설계 |
| 2026-10-31 | 구현 (PR #35) | [17 문서 후속 절](world-expansion/2026-10-11-v0.1.0/17_KID_REQUESTS_ISLANDS_TOWN.md) | 마을 건물·이웃집 안으로 걸어 들어가기 |
| 2026-10-25 | 구현 (PR #32~#34) | [17 섬·바닷속 비행기·마을 건물](world-expansion/2026-10-11-v0.1.0/17_KID_REQUESTS_ISLANDS_TOWN.md) | 섬 6곳, 맥도날드 3곳, 집 5단계, 이사 |
| 2026-10-20 | 구현 | [가족방 Supabase 계획](multiplayer/PLAN_SUPABASE_2026-10-20.md) · [설정](multiplayer/SUPABASE_SETUP.md) | 기기 간 가족방(인증·멤버십 RLS) |
| 2026-10-18 | 구현 | [15 순환형 생활 월드](world-expansion/2026-10-11-v0.1.0/15_LIVING_WORLD.md) · [16 아이 놀이](world-expansion/2026-10-11-v0.1.0/16_CHILD_PLAY.md) | 30마을, 식당, 가족 동행, 축제 |

## 생활형 오픈월드 확장 v0.1.0 (2026-10-11~)

[패키지 안내](world-expansion/2026-10-11-v0.1.0/README.md). 번호 순서가 작업 순서다. 앞 번호 문서의 '미구현' 표시는 **작성 당시 상태**다.

- 01~08: 요구사항, 코드 조사, 경험·경제 설계, 엔지니어링 검토, 수락 기준, 인계, 결정
- [09 구현 기록](world-expansion/2026-10-11-v0.1.0/09_IMPLEMENTATION_REPORT.md) (PR #15)
- [10 통합 월드 재구성](world-expansion/2026-10-11-v0.1.0/10_UNIFIED_WORLD_REBUILD.md): 분리된 바다를 하나의 월드로 정정. 09의 별도 해변 주장은 폐기
- [11 월드 다듬기·비행기](world-expansion/2026-10-11-v0.1.0/11_WORLD_POLISH_AND_AIRPLANE.md) · [12 할로윈·집 꾸미기](world-expansion/2026-10-11-v0.1.0/12_HALLOWEEN_AND_HOUSE_DECOR.md) · [13 실내 수정](world-expansion/2026-10-11-v0.1.0/13_INTERIOR_FIX.md) · [14 캐릭터 동작](world-expansion/2026-10-11-v0.1.0/14_CHARACTER_ANIMATION.md)

## 기반 문서

- [배포 운영](DEPLOY_GITHUB_PAGES.md): GitHub Pages Actions 실행과 문제 해결
- [초기 통합 제품 설계](superpowers/specs/2026-09-15-hyunjun-integrated-game-design.md): 러너/농장/집 저장·이동·조작 기준. 계획 문서는 [superpowers/plans](superpowers/plans/)
- [통합 요구사항 정의서 v1.0 (2026-10-18)](requirements/2026-10-18-integrated-requirements-v1.0.md): 옛 루트 `note.md`. 15·16 문서의 기준 요구사항
- [2026-10-11 당시 상태](archive/PROJECT_STATUS_2026-10-11.md): 과거 스냅샷. 현재 상태로 오해하지 않는다
- [가족방 초기 계획 (Cloudflare안, 2026-10-19)](archive/multiplayer-PLAN_2026-10-19-cloudflare.md): 채택하지 않음. 실제 구현은 Supabase
- 링크 검사: `node scripts/check-doc-links.mjs` (문서를 옮기거나 이름을 바꾼 뒤 실행)
- 시험 기록: [터치 월드](verification/2026-10-04-touch-world.md) · [조이스틱](verification/2026-10-11-joystick.md)
