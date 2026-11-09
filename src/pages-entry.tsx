import { FamilyAccountProvider } from "./components/hyunjun/useFamilyAccount";
/**
 * Static-hosting entry point for GitHub Pages and other file hosts.
 * The existing TanStack Start app remains unchanged: this entry uses the
 * same game components with a client-only Router and hash navigation.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { WorldEntry } from "./components/hyunjun/WorldEntry";
import { useMarkEntryRoute } from "./components/hyunjun/useWorldEntry";
import { Runner } from "./components/hyunjun/Runner";
import { Farm } from "./components/hyunjun/Farm";
import { RoomEscape } from "./components/hyunjun/RoomEscape";
import { PeanutGame } from "./components/hyunjun/PeanutGame";
import { ArcadeGame } from "./components/hyunjun/arcade/ArcadeGame";
import { KartHub } from "./components/hyunjun/KartHub";
import { House } from "./components/hyunjun/House";
import "./styles.css";
import "./hyunjun.css";

const queryClient = new QueryClient();

// An entry file is never hot-swapped, so the fast-refresh export rule does not apply.
// eslint-disable-next-line react-refresh/only-export-components
function PagesRoot() {
  useMarkEntryRoute();
  return (
    <QueryClientProvider client={queryClient}>
      <FamilyAccountProvider>
        <Outlet />
      </FamilyAccountProvider>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({
  component: PagesRoot,
  notFoundComponent: () => (
    <main className="hj-shell">
      <div className="hj-container hj-error">
        <h1>길을 살짝 벗어났어요</h1>
        <a className="hj-big" href="#/">
          마을로 돌아가기
        </a>
      </div>
    </main>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: WorldEntry,
});
const raceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/race",
  component: Runner,
});
const farmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/greenhouse",
  component: Farm,
});
const houseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/house",
  component: House,
});

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rooms",
  component: RoomEscape,
});

const peanutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/peanuts",
  component: PeanutGame,
});

const kartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kart",
  component: KartHub,
});

const miniRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mini/$game",
  component: ArcadeGame,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    raceRoute,
    farmRoute,
    houseRoute,
    kartRoute,
    peanutRoute,
    roomsRoute,
    miniRoute,
  ]),
  history: createHashHistory(),
  defaultPreloadStaleTime: 0,
});

// Keep the static-only router local. A global Register override would change
// src/routes/__root.tsx route-context inference in the existing SSR app.

const app = document.getElementById("root");
if (!app) throw new Error("Game root element not found");
createRoot(app).render(<RouterProvider router={router} />);
