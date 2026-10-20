import { canWalkRestaurant } from "@/game/restaurant";
import {
  ACTORS,
  actorScene,
  patrolPosition,
  nearActor,
  homeActorPosition,
  type ActorScene,
  type Actor,
} from "@/game/actors";
import { screenPoint, worldDistance, wrapPoint } from "@/game/world-space";
import { canWalkHome } from "@/game/life-world";
import { isWalkable, type Point } from "@/game/adventure";
import type { GameState } from "@/lib/world-model";
import { useEffect, useRef } from "react";
import { DadArt } from "./DadArt";
import { RobotArt } from "./RobotArt";
import { FriendArt } from "./FriendArt";
export function PersonArt({ actor, moving = false }: { actor: Actor; moving?: boolean }) {
  return actor.kind === "dad" ? (
    <DadArt moving={moving} />
  ) : actor.kind === "robot" ? (
    <RobotArt moving={moving} />
  ) : (
    <FriendArt index={actor.index} moving={moving} />
  );
}
export function People({
  state,
  scene,
  player,
  seconds,
  moving,
  onTalk,
  svg = false,
  helperPosition,
  hideFollowers = false,
  playerLayer,
}: {
  state: GameState;
  scene: ActorScene;
  player: Point;
  seconds: number;
  moving: boolean;
  onTalk: (id: string) => void;
  svg?: boolean;
  helperPosition?: Point | null;
  hideFollowers?: boolean;
  playerLayer?: "back" | "front";
}) {
  const trail = useRef<Point[]>([]);
  const key = useRef(scene);
  useEffect(() => {
    if (key.current !== scene) {
      trail.current = [];
      key.current = scene;
    }
    const last = trail.current.at(-1);
    if (!last || Math.hypot(last.x - player.x, last.y - player.y) > 4) {
      trail.current.push({ ...player });
      trail.current = trail.current.slice(-200);
    }
  }, [player, scene]);
  const assigned: Point[] = [];
  const people = ACTORS.filter(
    (a) =>
      actorScene(a, state, scene) === scene && !(hideFollowers && state.companions.includes(a.id)),
  )
    .map((actor) => {
      const followed = state.companions.indexOf(actor.id);
      let p: Point;
      if (followed >= 0) {
        const index = trail.current.length - 1 - (followed + 1) * 14;
        p = index >= 0 ? trail.current[index]! : player;
        const safe = (q: Point) =>
          scene === "home"
            ? canWalkHome(q, state.houseTier)
            : scene === "world"
              ? isWalkable(q)
              : canWalkRestaurant(q);
        if (index < 0 || !safe(p) || assigned.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 50)) {
          const offsets =
            scene === "home"
              ? [
                  { x: -30, y: 70 },
                  { x: 30, y: 70 },
                  { x: -30, y: 140 },
                  { x: 30, y: 140 },
                ]
              : [
                  { x: -85, y: 35 },
                  { x: 85, y: 35 },
                  { x: -85, y: 105 },
                  { x: 85, y: 105 },
                ];
          p =
            offsets
              .map((o) =>
                scene === "world"
                  ? wrapPoint({ x: player.x + o.x, y: player.y + o.y })
                  : { x: player.x + o.x, y: player.y + o.y },
              )
              .find(
                (q) => safe(q) && !assigned.some((a) => Math.hypot(a.x - q.x, a.y - q.y) < 50),
              ) ?? player;
        }
        if (followed === 0 && helperPosition) p = helperPosition;
        assigned.push(p);
      } else if (scene === "home") {
        p = homeActorPosition(actor.id, state.guests);
      } else p = patrolPosition(actor, seconds);
      if (scene === "world" && worldDistance(p, player) > 1000) return null;
      const placed = scene === "world" ? screenPoint(p, player) : p;
      return {
        actor,
        p: placed,
        near: nearActor(p, player, scene),
        moving:
          followed >= 0
            ? moving || (followed === 0 && !!helperPosition)
            : scene === "world" && actor.kind === "friend",
      };
    })
    .filter((x) => x !== null);
  if (svg)
    return (
      <>
        {people
          .filter(({ p }) => !playerLayer || p.y > player.y === (playerLayer === "front"))
          .map(({ actor, p, moving, near }) => (
            <g
              key={actor.id}
              data-person={actor.id}
              role="button"
              tabIndex={near ? 0 : -1}
              aria-label={`${actor.kind === "dad" ? "도우미 아빠" : actor.name} · 이야기`}
              style={{ pointerEvents: "all", cursor: near ? "pointer" : "default" }}
              onClick={() => {
                if (near) onTalk(actor.id);
              }}
              onKeyDown={(e) => {
                if (near && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  e.stopPropagation();
                  onTalk(actor.id);
                }
              }}
              transform={`translate(${p.x - 65} ${p.y - 185}) scale(1.3)`}
            >
              <PersonArt actor={actor} moving={moving} />
              <text x="48" y="162" textAnchor="middle" fontSize="22" fill="#405b64">
                {actor.kind === "dad" ? "도우미 아빠" : actor.name}
              </text>
            </g>
          ))}
      </>
    );
  return (
    <>
      {people
        .filter(({ p }) => !playerLayer || p.y > player.y === (playerLayer === "front"))
        .map(({ actor, p, near, moving }) => (
          <button
            key={actor.id}
            data-person={actor.id}
            className={`living-person ${near ? "near" : ""}`}
            style={{ left: p.x, top: p.y }}
            onClick={() => {
              if (near) onTalk(actor.id);
            }}
            aria-label={`${actor.kind === "dad" ? "도우미 아빠" : actor.name} · 이야기`}
          >
            <PersonArt actor={actor} moving={moving} />
            <b>{actor.kind === "dad" ? "도우미 아빠" : actor.name}</b>
          </button>
        ))}
    </>
  );
}
