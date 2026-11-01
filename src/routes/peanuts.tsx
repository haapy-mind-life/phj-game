import { createFileRoute } from "@tanstack/react-router";
import { PeanutGame } from "@/components/hyunjun/PeanutGame";
export const Route = createFileRoute("/peanuts")({
  head: () => ({ meta: [{ title: "박현준 땅콩 톡톡" }] }),
  component: PeanutGame,
});
