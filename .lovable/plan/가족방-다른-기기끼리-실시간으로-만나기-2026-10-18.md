# 가족방: 다른 기기끼리 실시간으로 만나기

지금 가족방은 같은 기기의 창끼리만 만납니다. 이번에는 가족 4명이 각자 다른 휴대폰·태블릿에서 같은 방 코드를 넣으면 서로의 캐릭터 위치, 옷, 이모티콘을 실시간으로 보게 합니다. 저장되는 데이터는 없습니다.

## 할 일
1. Lovable Cloud를 켭니다 (실시간 연결용으로만 쓰고, 저장용 표는 만들지 않습니다).
2. 다른 기기 연결 방식을 추가합니다. 방 코드마다 채널 하나를 쓰고, 위치·옷·이모티콘은 이미 있는 안전 검사(정해진 값과 숫자만 받기)를 그대로 거칩니다.
3. 누가 방에 있는지 표시합니다. 들어오고 나가는 사람이 바로 반영되고, 4명이 넘으면 더 못 들어옵니다.
4. 연결이 안 될 때(인터넷 끊김, 설정 없음)는 지금처럼 같은 기기 창끼리 만나는 방식으로 자동 전환하고, 안내 문구를 바꿉니다.
5. GitHub Pages 판에서도 같은 연결 주소와 공개 키로 동작하게 빌드 설정을 맞춥니다.

## 기술 메모
- 새 파일 `src/game/realtime-transport.ts`: `FamilyTransport`를 구현. Supabase 채널 `family:<CODE>`, Broadcast(`self: false`)로 `PlayerMessage` 전송, Presence로 인원 수와 4명 제한 판단.
- `useFamilyRoom`: 실시간 연결을 우선 시도, 실패 시 `createBroadcastTransport`로 대체. 기존 `shouldSend`(200ms 제한)와 `parsePlayerMessage` 유지.
- 채널은 비공개 인증 없이 공개 채널 사용; 방 코드(32^6 조합)가 사실상 열쇠. 테이블·RLS 없음.
- Pages 빌드: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 GitHub Actions 변수로 `build:pages` 단계에 주입. 값이 없으면 같은 기기 모드로 동작.
- 테스트: Presence 인원 제한과 대체 전환 규칙 단위 테스트 추가, 기존 `family-room.test.ts` 유지.
- `AGENTS.md`에 "가족방 실시간은 Broadcast/Presence만, 저장 없음" 규칙 기록.
