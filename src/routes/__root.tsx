import { FamilyAccountProvider } from "../components/hyunjun/useFamilyAccount";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import gameCss from "../hyunjun.css?url";
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "박현준 게임" },
      { name: "description", content: "현준이와 달리고, 키우고, 꾸미는 작은 마을" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: gameCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Jua&family=Gaegu:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: Root,
  notFoundComponent: () => (
    <main className="hj-shell">
      <div className="hj-container hj-error">
        <h1>길을 살짝 벗어났어요</h1>
        <Link to="/" className="hj-big">
          마을로 돌아가기
        </Link>
      </div>
    </main>
  ),
});
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
function Root() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <FamilyAccountProvider>
        <Outlet />
      </FamilyAccountProvider>
    </QueryClientProvider>
  );
}
