import { createFileRoute } from "@tanstack/react-router";
import { KartHub } from "@/components/hyunjun/KartHub";
export const Route = createFileRoute("/kart")({
  head: () => ({ meta: [{ title: "박현준 카트" }] }),
  component: KartHub,
});
