import { createFileRoute } from "@tanstack/react-router";
import { RoomEscape } from "@/components/hyunjun/RoomEscape";
export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "박현준 방 깨기" }] }),
  component: RoomEscape,
});
