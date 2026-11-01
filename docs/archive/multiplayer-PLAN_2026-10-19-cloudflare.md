> **보관 문서 (2026-11-01):** 가족방은 이 문서의 추천안(Cloudflare Worker)이 아니라 Supabase로 구현했다. 현재 기준은 [PLAN_SUPABASE_2026-10-20.md](../multiplayer/PLAN_SUPABASE_2026-10-20.md)와 [SUPABASE_SETUP.md](../multiplayer/SUPABASE_SETUP.md).

# 가족 멀티플레이 계획 (GitHub Pages 유지, Lovable 미사용)

상태: **계획 · Codex 검토 대기** (코드 미변경). 작성 2026-10-19.

## 1. 목표와 제약
- 아빠·엄마·누나·현준이 각자 기기에서 같은 주소(GitHub Pages)에 접속해 방 코드로 모이고 서로의 캐릭터를 본다(1단계).
- 호스팅은 GitHub Pages 그대로. Lovable은 쓰지 않는다. 저장 데이터는 각자 브라우저(localStorage)에 둔다.
- 공개 저장소이므로 비밀 값(키·토큰)은 저장소에 넣지 않는다. 아이용이므로 자유 텍스트 채팅은 없다.
- 이미 main에 있는 것: 방 코드·메시지 검증·전송 제한·보간(`src/game/family-room.ts`), 전송 추상화(`family-transport.ts`, 현재 같은 기기 BroadcastChannel), 원격 아바타·패널. **새로 만들 것은 "다른 기기로 가는 전송" 하나뿐이다.**

## 2. 선택지
| | A. Supabase 직접 | B. Cloudflare Worker + Durable Object (추천) | C. WebRTC P2P |
|---|---|---|---|
| 구조 | 본인 Supabase 계정, Realtime Broadcast/Presence | Worker가 방(DO)마다 WebSocket을 받아 서로에게 중계 | 브라우저끼리 직접 연결, 중개 서버 필요 |
| 클라이언트 비밀 | 공개용 키가 번들에 들어감 | **없음**(방 주소만) | 없음 |
| 검증 | 클라이언트 측 검증만 | **서버에서도 같은 `parsePlayerMessage`로 검증**, 방 인원 4명 서버가 강제 | 클라이언트 측 |
| 무료 한도 위험 | 7일 미사용 시 프로젝트 일시정지(재개 수동), 동시 200·초당 100 메시지 | 하루 10만 요청(WS 메시지는 20:1 환산) | 없음 |
| 2단계(집·농장 공유) 확장 | 테이블 설계 필요 | DO 저장소에 방 상태 보관 가능 | 어려움 |
| 비용·운영 | 계정 1개 | Cloudflare 계정 + Worker 배포 | 연결 실패 변수 많음 |

한도 수치는 제3자 글 기준이며 **공식 페이지 확인 필요**(특히 Durable Objects 무료 duration 한도는 출처에서 숫자가 깨져 있음).

추천 근거: 비밀 값이 필요 없고, 서버가 검증·인원 제한을 강제하며, 일시정지 문제가 없고, 2단계로 확장할 수 있다. 대가는 Cloudflare 계정과 Worker 코드(약 100줄) 추가.

## 3. 추천안(B) 설계
**구성**: `worker/`(새 디렉터리, Pages 빌드와 분리) = Worker 진입점 + `FamilyRoom` Durable Object. 클라이언트는 `wss://<worker>/room/<CODE>`에 접속.

**서버 동작(최소)**
- `GET /room/:code` + `Upgrade: websocket` 만 허용. 코드는 `normalizeRoomCode` 규칙(6자, 헷갈리는 문자 제외)이 아니면 400.
- `Origin`이 `https://haapy-mind-life.github.io`(및 로컬 개발 주소)가 아니면 403.
- DO는 WebSocket Hibernation API 사용(유휴 시 duration 과금 방지). 연결마다 `serializeAttachment`에 `{id}`만 저장.
- 메시지 수신 → `parsePlayerMessage`로 검증 → 실패는 버림 → 보낸 연결을 뺀 나머지에 중계. 연결당 5회/초 초과분은 버림(서버 측 제한). 방 인원이 4명이면 5번째 연결은 거절(close 1008).
- 방 상태 저장 없음(1단계). 마지막 위치 캐시도 없음 → 새로 들어온 사람은 상대가 움직일 때 보이게 됨(필요하면 DO 메모리의 최근 메시지를 입장 시 한 번 전달).

**클라이언트**
- `family-transport.ts`에 `createWebSocketTransport(code, url)` 추가, `useFamilyRoom`은 설정에 URL이 있으면 이것을, 없으면 지금의 BroadcastChannel을 사용. 연결이 끊기면 지수 백오프로 재연결(최대 5초), 상태(연결 중/연결됨/끊김)를 패널에 표시.
- 서버 URL은 빌드 시 `VITE_FAMILY_WS_URL`(공개 주소라 비밀 아님)로 주입. 값이 없으면 같은 기기 모드로 동작(현재와 동일).
- 메시지 스키마·방 코드·UI는 변경 없음.

**배포**
- Pages: 기존 워크플로 그대로(+ 빌드 env에 `VITE_FAMILY_WS_URL` 한 줄, 저장소 Variables 사용).
- Worker: 별도 워크플로 `worker.yml`(`worker/**` 변경 시 `wrangler deploy`). 필요한 비밀은 `CLOUDFLARE_API_TOKEN`과 계정 ID를 **GitHub Actions Secrets**에만 등록(사용자 작업). 토큰 권한은 해당 Worker 배포로 최소화.

**테스트**
- 단위: 서버 로직(검증·중계·속도 제한·인원 제한)을 Durable Object 클래스에서 떼어낸 순수 함수로 두고 `node --test`로 검증(`worker/room-logic.ts`가 `family-room.ts`를 import).
- 통합: `wrangler dev` 로컬 서버에 브라우저 두 개(다른 컨텍스트)로 접속해 양방향 표시 확인.
- 실기기: 휴대폰(LTE)과 PC(Wi-Fi)로 접속해 지연·재연결 확인.

## 4. 구현 순서
1. 서버 순수 로직 + 테스트 (네트워크 없음)
2. DO/Worker 껍데기 + `wrangler dev`로 로컬 확인
3. 클라이언트 WebSocket 전송 + 재연결 + 상태 표시 + 테스트
4. 빌드 env·워크플로 추가, 로컬 두 브라우저 검증
5. (사용자) Cloudflare 계정·토큰·Secrets 등록 → Worker 배포 → Pages 배포
6. 실기기 확인, 문서화

## 5. 사용자가 해야 하는 것
- Cloudflare 무료 계정 가입, API 토큰 발급, GitHub Secrets 등록(`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)과 Variables 등록(`VITE_FAMILY_WS_URL`). 토큰은 대화창에 붙여 넣지 말고 GitHub 화면에서만 입력.

## 6. 위험과 대응
| 위험 | 대응 |
|---|---|
| 무료 한도 초과(하루 10만 요청) | 위치 전송 5회/초·정지 시 생략으로 억제, 한도 계산을 공식 문서로 확인, 초과 시 같은 기기 모드로 자동 대체 |
| 방 코드 추측 | 6자리(약 10억 조합)·4명 제한·검증으로 피해 최소화, 로그인은 이번 범위 밖 |
| 서버 장애/재연결 | 클라이언트 재연결 + 상태 표시, 게임 진행은 영향 없음 |
| 공개 저장소의 설정 노출 | 비밀 값은 Secrets에만, 공개 주소는 Variables |
| Origin 검사 우회(브라우저 밖 접속) | 인원·속도·검증 제한이 실제 방어선, Origin은 보조 |

## 7. Codex 검토 요청 항목
1. A/B/C 선택 판단이 합리적인가? 놓친 대안(Ably 등)이 있는가?
2. 서버 설계(Hibernation, 연결 attachment, 속도·인원 제한, Origin 검사)에 결함이 없는가? 순수 로직 분리 방식이 테스트하기 좋은가?
3. 클라이언트의 `family-room.ts` 로직(방 코드 `% 32` 편향, `shouldSend` 로직, `applyMessage`의 인원 상한 처리, 보간)에 버그가 없는가?
4. 보안: 아이용 게임으로서 충분한가(자유 텍스트 없음, 좌표·열거형만)? 공개 저장소·Secrets 처리에 빠진 것이 있는가?
5. 배포 워크플로(Pages + Worker 분리, 토큰 최소 권한)와 롤백 방법이 적절한가?
6. 구현 순서와 범위(1단계)가 적절한가? 2단계로 넘기는 항목이 맞는가?
