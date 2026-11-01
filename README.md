# 박현준 게임

아이가 직접 캐릭터를 움직여 하나의 큰 마을·바다·하늘을 돌아다니는 어린이용 웹 게임입니다.
마을 생활(집·식당·가족 동행), 로봇 소환·합체·군단, 러너, 온실 농장, 가족방, 카트 허브의 미니게임이 한 저장 파일을 공유합니다.

- 플레이: GitHub Pages (`main` 병합 시 자동 배포, [배포 안내](docs/DEPLOY_GITHUB_PAGES.md))
- 편집: [Lovable](https://lovable.dev)과 연결되어 있습니다. 이미 푸시된 기록은 다시 쓰지 않습니다(`AGENTS.md` 참고).

## 빠른 시작

```sh
bun install --frozen-lockfile   # bun.lock 기준
npm run dev                     # 로컬 개발 서버
npm run check                   # 단위 테스트 + 타입 검사 + 린트 (PR 전 필수)
npm run build:pages             # GitHub Pages용 정적 빌드 → dist-pages/
```

## 구조

| 경로 | 역할 |
|---|---|
| `src/routes/` | 화면 경로: `/`(마을 월드), `/kart`(게임 목록), `/race`(러너), `/peanuts`(땅콩 톡톡), `/rooms`(방 깨기), `/house`, `/greenhouse`(온실). Pages 정적 빌드는 `src/pages-entry.tsx`의 해시 라우터에도 같은 경로를 등록한다 |
| `src/game/` | 화면과 분리된 순수 규칙과 `*.test.ts` 단위 테스트. `world/`(월드·실내·입력), `robot/`(로봇), `play/`(미니게임·장사·러너·온실·카트 목록), `economy/`(차량·성장), `family/`(가족방) |
| `src/lib/` | 공통 저장 상태 `world-model.ts`(reducer·저장 마이그레이션), 가족방 연결 |
| `src/components/hyunjun/` | 게임 화면 UI와 그림(SVG) 컴포넌트 |
| `src/components/ui/` | Lovable 기본 UI 키트 |
| `scripts/verify-*.cjs` | 실제 브라우저로 동선을 확인하는 검증 스크립트 |
| `supabase/` | 가족방 인증·멤버십 마이그레이션 |
| `docs/` | 요구사항·설계·검증 기록. 시작은 [docs/README.md](docs/README.md) |
| `MEMORY.md` | 에이전트 공용 작업 기억과 다음 작업 목록 |

## 작업 규칙 요약

1. 새 규칙은 먼저 `src/game/`의 알맞은 하위 폴더에 순수 함수와 테스트로 만들고, 그다음 화면에 연결합니다.
2. 브랜치에서 작업하고 `npm run check`가 통과해야 PR을 엽니다. `main`에 직접 푸시하지 않습니다.
3. 화면이 바뀌면 `scripts/verify-*.cjs`나 스크린샷으로 확인하고, 실행하지 못한 검증은 NOT_RUN으로 기록합니다.
4. 저장 형식을 바꿀 때는 `migrateSave`에 기본값을 넣어 기존 저장을 보존합니다.

에이전트(Claude, Codex 등) 작업 규칙은 [AGENTS.md](AGENTS.md)에 있습니다.
