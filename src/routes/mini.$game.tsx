import { createFileRoute } from "@tanstack/react-router";
import { ArcadeGame } from "@/components/hyunjun/arcade/ArcadeGame";
export const Route = createFileRoute("/mini/$game")({
  head: () => ({ meta: [{ title: "박현준 미니게임" }] }),
  component: ArcadeGame,
});
