# 가족방 Supabase 연결 가이드

게임 주소와 호스팅은 GitHub Pages 그대로 사용한다. Supabase는 가족 로그인과 실시간 위치·인사만 담당한다. 돈·집·농장·차량 저장은 각 기기의 기존 저장에 남는다. Lovable이나 별도 Worker 서버는 필요 없다.

현재 구현은 **프로젝트 연결 준비 완료** 상태다. 아래 대시보드 설정과 실제 프로젝트·기기 확인은 별도로 수행해야 한다. 개발 브라우저의 가짜 서비스 테스트는 실제 Supabase 연결 성공을 뜻하지 않는다.

## 1. 무료 프로젝트 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 가입·로그인한다.
2. 새 프로젝트를 만든다. 기존 업무용 프로젝트와 분리된 게임 전용 프로젝트를 권장한다.
3. 프로젝트 이름과 데이터베이스 비밀번호를 정한다. **DB 비밀번호는 게임에 넣지 않는다.**
4. 프로젝트의 Connect 또는 Settings → API Keys에서 다음 두 값을 확인한다.

| 필요한 값                            | 용도                    |
| ------------------------------------ | ----------------------- |
| Project URL: `https://….supabase.co` | 게임이 접속할 공개 주소 |
| Publishable key: `sb_publishable_…`  | 브라우저용 공개 키      |

기존 프로젝트의 `anon` 키도 지원한다. `sb_secret_…`와 `service_role` 키는 사용하지 않는다. 키를 Secrets에 넣더라도 `VITE_` 변수는 최종 브라우저 파일에 포함되므로 비밀 키를 넣어서는 안 된다.

## 2. 가족 계정 네 개 만들기

1. Authentication → Users → Add user / Create user에서 아빠·엄마·누나·현준 계정을 각각 만든다.
2. 이메일·비밀번호를 정하고 이메일 확인이 완료된 계정으로 만든다. 관리자 생성의 Auto Confirm 옵션을 사용할 수 있다.
3. **각 계정의 User UID**를 복사해 둔다. 계정 이메일이나 비밀번호와는 다른 UUID다.
4. Authentication 설정에서 공개 신규 회원가입을 끈다. 이 게임에는 회원가입 화면이 없다.
5. URL Configuration의 Site URL은 실제 게임 주소, 예를 들어 `https://haapy-mind-life.github.io/phj-game/`로 설정한다.

아이에게 이메일 입력을 맡길 필요는 없다. 부모가 각 기기에 한 번 로그인하면 해당 브라우저의 세션을 사용한다. 비밀번호는 코드·저장소·GitHub Variables·대화창에 넣지 않고 게임의 로그인 화면에만 입력한다. 게임을 닫았다 다시 열 때 세션이 유효하면 다시 로그인할 필요가 없다. 공용 기기는 사용 후 “이 기기 로그아웃”을 누른다.

## 3. 가족 전용 접근 권한 설정

1. SQL Editor에서 [가족방 SQL](../../supabase/migrations/202610200001_family_room.sql)을 열어 **내용 전체를 실행**한다. 이 SQL은 구성원 테이블과 비공개 실시간 채널 권한을 만든다. 게임 재화 테이블은 만들지 않는다.
2. 아래 예제의 네 `USER_UID_…`를 2단계에서 복사한 실제 UUID로 바꾸고 **한 번 실행**한다. 네 행에 같은 `family_id`가 자동으로 배정된다.

```sql
with family as (
  select gen_random_uuid() as id
)
insert into public.family_members (user_id, family_id, nickname)
select member.user_id::uuid, family.id, member.nickname
from family
cross join (values
  ('USER_UID_DAD', '아빠'),
  ('USER_UID_MOM', '엄마'),
  ('USER_UID_SISTER', '누나'),
  ('USER_UID_CHILD', '현준')
) as member(user_id, nickname);
```

3. Table Editor의 `family_members`에서 네 행의 `family_id`가 같고 이름이 올바른지 확인한다. 가족 구성원은 관리자만 등록·수정할 수 있다.
4. Realtime 설정에서 **Allow public access를 끄고 private 채널만 허용**한다. 필요한 Broadcast와 Presence는 켠다.
5. 새 프로젝트가 아니라면 `realtime.messages`에 다른 광범위한 허용 정책이 남아 있지 않은지 확인한다. 이 게임이 추가하는 정책 이름은 `family_receives_private`, `family_sends_private`다.

다른 가족의 프로젝트 구성원을 추가할 때는 별도의 `family_id`를 사용한다. 같은 방 코드를 입력해도 가족 ID가 다르면 서로 만나지 않는다. 계정을 Authentication에 만들기만 하고 구성원 행을 등록하지 않으면 게임은 접속을 허용하지 않는다.

구성원은 네 이름으로 제한되지만 **서버가 WebSocket 연결을 정확히 네 개로 제한하는 구조는 아니다.** 가족당 네 기기, 기기당 게임 창 하나로 사용한다. 화면의 방 정원 확인은 편의 기능이다. 닉네임은 구성원 정보에서 표시하며 금전·게임 권한을 부여하는 관리자 역할이 아니다.

## 4. 게임에 공개 설정 넣기

### 내 PC에서 먼저 확인

저장소의 `.env.example`을 참고해 `.env.local`을 만들고 실제 공개 값 두 개를 넣는다. `.env.local`은 커밋하지 않는다.

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

```bash
bun install --frozen-lockfile
npm run build:pages
npm run preview:pages -- --host 127.0.0.1 --port 4183
```

브라우저에서 `http://127.0.0.1:4183/phj-game/`를 연다. 환경 변수를 바꾸면 다시 빌드해야 한다. 개발 서버를 쓰는 경우에도 서버를 다시 시작한다.

두 값이 모두 없으면 화면에 **같은 기기 연습 모드**라고 나온다. 한 값만 있거나 비밀 키를 넣으면 설정 오류를 표시한다. 온라인 연결이 실패했다고 조용히 연습 모드로 바꾸지는 않는다.

### GitHub Pages 설정

1. 저장소 Settings → Secrets and variables → Actions → **Variables**를 연다.
2. 다음 Repository variables 두 개를 등록한다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Supabase 연결 코드가 포함된 버전이 승인·반영된 뒤 기존 Pages 워크플로로 다시 빌드·배포한다. 공개 변수만 추가했을 때도 재배포해야 한다.

이 가이드나 구현 과정에서 자동 push·merge·Supabase SQL 실행·운영 배포를 수행하지 않는다. Supabase 프로젝트를 제어하는 개인 토큰도 필요 없다.

## 5. 실제로 가족 만나기

1. 아빠 기기에서 게임의 “가족방”을 열고 아빠 계정으로 로그인한다.
2. “방 만들기”를 눌러 6자리 코드를 확인한다.
3. 다른 기기는 각각 가족 계정으로 로그인한 뒤 같은 코드를 입력한다.
4. 같은 지상 마을에서 서로 움직이고 인사한다. “가족과 연결됐어요” 표시를 확인한다.
5. 한 명이 가만히 있어도 사라지지 않는지, 늦게 들어온 사람도 기존 가족을 보는지 확인한다.
6. 집·식당·잠수함·미니게임에서는 월드 캐릭터가 숨고, 지상으로 돌아오면 다시 보인다. 실내·차량 외형과 게임 목표는 아직 공동 진행하지 않는다.
7. Wi-Fi와 휴대폰 LTE/5G처럼 서로 다른 네트워크에서도 확인한다. 비행기 모드를 켰다 끄고 재연결 표시와 복귀도 확인한다.

가입하지 않은 계정, 구성원으로 등록되지 않은 계정, 로그아웃 상태에서는 가족방에 들어갈 수 없어야 한다. Presence는 입퇴장에만 사용하고 이동은 Broadcast로 보낸다. 정지 상태는 2초 heartbeat로 유지하며 모든 일반 상태·인사 전송은 초당 최대 5회로 제한한다. 입장·재연결의 초기 상태 전달은 별도로 발생한다.

## 6. 연결이 안 될 때

| 화면·현상                  | 확인할 것                                               |
| -------------------------- | ------------------------------------------------------- |
| 같은 기기 연습 모드        | 두 공개 변수가 빌드에 전달됐는지, 재배포했는지          |
| 이메일·비밀번호 확인       | 관리자 생성 계정, 이메일 확인 여부, 올바른 암호         |
| 부모님이 가족으로 등록     | 로그인 계정 UID가 `family_members.user_id`와 일치하는지 |
| 가족 정보 확인 실패        | SQL 실행 여부, 프로젝트가 일시정지됐는지                |
| 로그인되지만 방 연결 실패  | Realtime private 설정, 두 정책, 유효한 세션             |
| 같은 코드인데 안 만남      | 네 구성원의 `family_id`, 같은 마을·지상 화면인지        |
| 방이 가득 참               | 중복 창을 닫고 잠시 기다린 후 다시 연결                 |
| 위치는 되지만 집·돈이 다름 | 정상 동작. 이 단계는 개인 저장을 유지함                 |

무료 플랜은 1주 미사용 시 프로젝트가 일시정지될 수 있다. Dashboard에서 재개해야 한다. 무료 Realtime 메시지는 월 200만 건이며 송신·수신을 함께 센다. 네 명이 모두 초당 5번 계속 움직이면 하루 30분·30일 기준 약 432만 건에 입퇴장 메시지가 추가된다. 무료를 보장하지 않으므로 Dashboard의 사용량을 확인한다. Pro는 월 $25부터이며 한도·가격은 가입 시 공식 페이지를 다시 확인한다.

- [공개 키와 비밀 키](https://supabase.com/docs/guides/getting-started/api-keys)
- [비공개 Broadcast·Presence 권한](https://supabase.com/docs/guides/realtime/authorization)
- [Presence](https://supabase.com/docs/guides/realtime/presence)
- [요금](https://supabase.com/pricing)
- [메시지 사용량 계산](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages)
