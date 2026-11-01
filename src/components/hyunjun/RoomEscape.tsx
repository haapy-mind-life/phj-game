import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BRIDGE_CELL,
  KEY_CELL,
  PLATE_CELL,
  ROOM_EXITS,
  ROOM_MAPS,
  ROOM_RUN_REWARD,
  bridgeOpen,
  moveRoom,
  newRoomRun,
  nextRoom,
  retryRoom,
  roomDoorOpen,
  sameCell,
  tickRoom,
  type RoomDirection,
} from "@/game/play/room-escape";
import { useGame } from "@/lib/game-state";
import { Shell } from "./Shell";
import "./rooms.css";

const INFO = [
  { name: "열쇠의 방", rule: "열쇠까지 걸어가서 주운 다음 문으로 가요.", icon: "🔑" },
  { name: "상자의 방", rule: "상자를 밀어 별 발판에 올리면 문이 열려요.", icon: "📦" },
  {
    name: "빛의 다리",
    rule: "초록불일 때 다리를 건너 문으로 가요. 다리 위에서 빨간불이 되면 다시 도전!",
    icon: "🌉",
  },
] as const;
const KEYS: Record<string, RoomDirection> = {
  ArrowUp: "up",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowRight: "right",
};
const DIRECTIONS = [
  { direction: "up", name: "위로 이동", icon: "▲", row: 1, col: 2 },
  { direction: "left", name: "왼쪽으로 이동", icon: "◀", row: 2, col: 1 },
  { direction: "down", name: "아래로 이동", icon: "▼", row: 2, col: 2 },
  { direction: "right", name: "오른쪽으로 이동", icon: "▶", row: 2, col: 3 },
] as const;

export function RoomEscape() {
  const { state, ready, dispatch, getState } = useGame();
  const [game, setGame] = useState(newRoomRun);
  const [reward, setReward] = useState<number | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const session = useRef("");
  const paid = useRef("");
  useEffect(() => {
    const pause = () => setGame((g) => (g.phase === "playing" ? { ...g, phase: "paused" } : g));
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (game.phase === "playing") board.current?.focus({ preventScroll: true });
  }, [game.phase, game.room]);
  useEffect(() => {
    if (game.phase !== "playing" || game.room !== 2) return;
    let frame = 0,
      last = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      setGame((g) => tickRoom(g, elapsed));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [game.phase, game.room]);
  useEffect(() => {
    if (game.phase !== "won" || !session.current || session.current === paid.current) return;
    const before = getState().money;
    const after = dispatch({ type: "settle-rooms", id: session.current, rooms: 3 });
    paid.current = session.current;
    setReward(after.money - before);
  }, [game.phase, dispatch, getState]);
  const start = () => {
    session.current = `rooms-${crypto.randomUUID()}`;
    setReward(null);
    setGame({ ...newRoomRun(), phase: "playing" });
  };
  const active = game.phase === "playing";
  const green = bridgeOpen(game);
  const info = INFO[game.room];
  const exit = ROOM_EXITS[game.room]!;
  return (
    <Shell
      className="rooms-shell"
      active="mini"
      title="박현준 방 깨기"
      subtitle="걸어서 찾고, 밀고, 건너요! 세 개의 방을 탈출하는 모험"
    >
      <section
        className="rooms-game"
        data-room={game.room}
        data-phase={game.phase}
        data-x={game.player.x}
        data-y={game.player.y}
        data-crate-x={game.crate.x}
        data-crate-y={game.crate.y}
        data-key={game.key}
        data-green={green}
        data-time={game.elapsed}
      >
        <p className="rooms-record">내 기록 {state.roomEscapeBest}/3개 방 탈출</p>
        {game.phase === "ready" ? (
          <div className="rooms-intro">
            <h2>세 방의 비밀을 풀어 봐요</h2>
            <ol>
              {INFO.map((room) => (
                <li key={room.name}>
                  <span aria-hidden="true">{room.icon}</span>
                  <strong>{room.name}</strong>
                  <p>{room.rule}</p>
                </li>
              ))}
            </ol>
            <p>
              화살표 버튼이나 키보드로 한 칸씩 걸어요.
              <br />
              막히면 이 방만 다시 시작해도 괜찮아요.
            </p>
            <p>
              세 방을 모두 탈출하면 별코인 {ROOM_RUN_REWARD}개!
              <br />
              도중에 나가거나 새로고침하면 첫 방부터 시작해요.
            </p>
            <button className="hj-big" disabled={!ready} onClick={start}>
              세 방 모험 시작
            </button>
          </div>
        ) : (
          <>
            <div className="rooms-progress" aria-label="모험 진행">
              {INFO.map((room, i) => (
                <span key={room.name} aria-current={i === game.room ? "step" : undefined}>
                  {i < game.room || game.phase === "won" ? "✓" : i + 1} {room.icon}
                </span>
              ))}
            </div>
            <h2>
              {game.room + 1}번째 · {info.name}
            </h2>
            <p className="rooms-rule" id="rooms-rule">
              {info.rule}
            </p>
            <p
              className={`rooms-signal ${game.room === 2 && !green ? "red" : "green"}`}
              role="status"
            >
              {game.room === 0
                ? game.key
                  ? "🔑 열쇠를 찾았어요! 문으로 가요."
                  : "🔒 열쇠를 먼저 찾아요."
                : game.room === 1
                  ? roomDoorOpen(game)
                    ? "★ 발판 위에 상자! 문이 열렸어요."
                    : "★ 상자를 별 발판까지 밀어 봐요."
                  : `${green ? "✓ 초록불 · 건너요" : "멈춤 · 빨간불"} · ${Math.ceil(green ? 7 - (game.elapsed % 7) : 3 - (game.elapsed % 7))}초`}
            </p>
            <div
              ref={board}
              className="rooms-board"
              role="group"
              aria-label={`${info.name} 지도, 현재 가로 ${game.player.x} 세로 ${game.player.y}`}
              aria-describedby="rooms-rule"
              tabIndex={0}
              onKeyDown={(e) => {
                const direction = KEYS[e.key];
                if (direction) {
                  e.preventDefault();
                  setGame((g) => moveRoom(g, direction));
                }
              }}
            >
              {ROOM_MAPS[game.room].flatMap((row, y) =>
                [...row].map((tile, x) => {
                  const cell = { x, y };
                  const bridge = game.room === 2 && sameCell(cell, BRIDGE_CELL);
                  const door = sameCell(cell, exit);
                  const plate = game.room === 1 && sameCell(cell, PLATE_CELL);
                  const icon = door
                    ? roomDoorOpen(game)
                      ? "🚪"
                      : "🔒"
                    : game.room === 0 && !game.key && sameCell(cell, KEY_CELL)
                      ? "🔑"
                      : game.room === 1 && sameCell(cell, game.crate)
                        ? "📦"
                        : bridge
                          ? green
                            ? "✓"
                            : "✋"
                          : plate
                            ? "★"
                            : "";
                  return (
                    <span
                      key={`${x}-${y}`}
                      aria-hidden="true"
                      className={`rooms-tile ${tile === "#" ? "wall" : "floor"} ${bridge ? (green ? "bridge open" : "bridge closed") : ""} ${plate ? "plate" : ""} ${door ? "door" : ""}`}
                    >
                      {icon}
                    </span>
                  );
                }),
              )}
              <span
                className="rooms-player"
                aria-hidden="true"
                style={{
                  left: `${((game.player.x + 0.5) / 7) * 100}%`,
                  top: `${((game.player.y + 0.5) / 5) * 100}%`,
                }}
              >
                🧑‍🚀
              </span>
            </div>
            <div className="rooms-pad" role="group" aria-label="캐릭터 이동">
              {DIRECTIONS.map((button) => (
                <button
                  key={button.direction}
                  aria-label={button.name}
                  data-dir={button.direction}
                  disabled={!active}
                  style={{ gridRow: button.row, gridColumn: button.col }}
                  onClick={() => setGame((g) => moveRoom(g, button.direction))}
                >
                  {button.icon}
                </button>
              ))}
            </div>
            {active && (
              <div className="rooms-actions">
                <button onClick={() => setGame((g) => ({ ...g, phase: "paused" }))}>
                  잠깐 쉬기
                </button>
                <button onClick={() => setGame(retryRoom)}>이 방 처음부터</button>
              </div>
            )}
            {game.phase === "paused" && (
              <div className="rooms-result">
                <h2>잠깐 쉬는 중</h2>
                <p>불빛도 함께 쉬어요.</p>
                <button
                  className="hj-big"
                  onClick={() => setGame((g) => ({ ...g, phase: "playing" }))}
                >
                  이어서 모험
                </button>
              </div>
            )}
            {game.phase === "room-clear" && (
              <div className="rooms-result" role="status">
                <h2>이 방 탈출 성공!</h2>
                <button className="hj-big" onClick={() => setGame(nextRoom)}>
                  다음 방으로
                </button>
              </div>
            )}
            {game.phase === "lost" && (
              <div className="rooms-result" role="status">
                <h2>빨간불에는 잠깐 멈춰요</h2>
                <p>괜찮아요! 이번 방에서 다시 도전해요.</p>
                <button className="hj-big" onClick={() => setGame(retryRoom)}>
                  이 방 다시 도전
                </button>
              </div>
            )}
            {game.phase === "won" && (
              <div className="rooms-result" role="status">
                <h2>세 방 탈출 성공!</h2>
                <p>별코인 {reward ?? "…"}개를 받았어요.</p>
                <button className="hj-big" onClick={start}>
                  처음부터 한 번 더
                </button>
              </div>
            )}
          </>
        )}
        <Link className="rooms-return" to="/kart">
          카트로 돌아가기
        </Link>
      </section>
    </Shell>
  );
}
