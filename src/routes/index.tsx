import { createFileRoute } from "@tanstack/react-router";
import { WorldEntry } from "@/components/hyunjun/WorldEntry";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "박현준 게임 · 작은 마을" }] }),
  component: WorldEntry,
});
