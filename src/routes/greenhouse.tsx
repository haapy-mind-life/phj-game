import { createFileRoute } from "@tanstack/react-router";
import { Farm } from "@/components/hyunjun/Farm";
export const Route = createFileRoute("/greenhouse")({
  head: () => ({ meta: [{ title: "박현준 온실 농장" }] }),
  component: Farm,
});
