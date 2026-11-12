# GitHub Pages에서 박현준 게임 직접 실행

> 상태: 2026-10-11 배포 설정 추가. **실제 사이트 개통 여부는 GitHub Pages Settings 및 Actions 결과로 확인해야 합니다.**

## 목표와 구성

- 원본 게임: `src/components/hyunjun/`의 마을/러너/농장/집/미니게임 컴포넌트를 그대로 사용.
- TanStack Start(SSR) 개발용 빌드는 `npm run build`로 그대로 유지.
- 독립 정적 빌드: `npm run build:pages`. `vite.pages.config.ts`는 SSR 서버 설정을 사용하지 않음.
- 주소: `https://haapy-mind-life.github.io/phj-game/` (실제 배포 성공 전까지 **예정 주소**).
- 페이지 내 이동: `#/race`, `#/greenhouse`, `#/house` 해시 라우팅으로 새로고침과 정적 호스팅 경로 충돌을 회피.
- 로컬 저장: 기존 `hyunjun-game-v2` 키 및 이전 저장 마이그레이션 규칙은 동일한 게임 코드에서 유지.

## 개통 단계

1. 변경사항을 검토/병합해 `main`에 반영합니다.
2. GitHub의 `carrot-racer-farm > Settings > Pages`에서 `Build and deployment > Source > GitHub Actions`를 선택합니다. 계정 요금제에서 **비공개 저장소 Pages** 이용을 허용하는지 확인합니다.
3. `Actions > Direct Game Play (GitHub Pages)`에서 `main`의 빌드, 테스트, 배포 잡이 **success**인지 확인합니다.
4. 성공 시 `Settings > Pages > Visit site` 또는 위 예정 주소를 열어 실제로 실행합니다.
5. 휴대폰/태블릿에서 조이스틱 이동, 오른쪽 버튼, 마을 전환, 러너, 농장, 집, 미니게임과 새로고침을 검증합니다.

배포 설정을 바꾸는 전용 GitHub 연동 작업은 현재 제공되지 않으므로 Pages의 Source 선택은 GitHub 설정 화면에서 확인해야 합니다.

## 개발자 실행

```sh
bun install --frozen-lockfile
npm run dev                    # 기존 서버 앱
npm run build                  # 기존 SSR 빌드
npm run build:pages            # 정적 Pages 빌드 -> dist-pages/index.html
npm run preview:pages          # 정적 결과 로컬 확인 (기본 Pages 하위 경로)
PAGES_BASE_PATH=/ npm run build:pages # 사이트 루트로 배포하는 대안
```

`preview:pages`는 빌드 결과를 Vite가 제공하는 브라우저 테스트 환경입니다. 로컬 폴더의 HTML을 더블클릭해서 실행하는 것은 권장하지 않습니다. `dist-pages/`는 추적하지 않습니다.

## 보안·데이터 주의

- **비공개 저장소라 하더라도 GitHub Pages로 만든 사이트는 기본적으로 공개될 수 있습니다.** 게시할 코드/에셋에 비밀키, 개인정보, 실제 계정 식별자를 넣지 않습니다.
- 게임 저장 데이터는 브라우저 origin별 localStorage에 저장됩니다. **다른 도메인(이전 미리보기 주소 등)의 진행기록은 GitHub Pages 도메인으로 자동 이동하지 않습니다.** 추후 저장 내보내기/가져오기 작업이 필요합니다.
- Pages에 로그인, 서버 API, DB 기능이 추가되면 이 정적 배포 설계는 다시 검토해야 합니다.
- 배포 검증과 실제 기기 검증은 별개입니다. 자동화 테스트/타입검사/번들 생성만으로 Samsung Browser와 S Pen 실동작을 단정하지 않습니다.

## 실패 시 진단

| 증상 | 확인할 것 |
| --- | --- |
| Pages deploy failed / not enabled | Settings > Pages > GitHub Actions 선택, 요금제/Pages 권한 |
| `bun install` 실패 | 잠긴 `bun.lock` 및 의존성 배포 레지스트리 접근 상태 |
| 404 또는 빈 화면 | Actions 배포 로그, `dist-pages/index.html`, Vite `base` 경로 |
| URL 이동 후 새로고침 실패 | 링크가 `#/race` 등 해시 주소를 사용하는지 |
| 이전 기록 없음 | 기존 도메인과 Pages 도메인의 저장 공간은 분리됨 |

마지막으로 실제 배포 확인 시 해당 검증일, 배포 SHA, 화면/기기 결과를 이 문서에 기록합니다.
