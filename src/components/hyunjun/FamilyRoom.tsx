import { useState } from "react";
import {
  EMOTES,
  NICKNAMES,
  drawPosition,
  visibleRemotes,
  type FamilyRegion,
} from "@/game/family-room";
import type { useFamilyRoom } from "./useFamilyRoom";
import { PlayerAvatar } from "./PlayerAvatar";

type Room = ReturnType<typeof useFamilyRoom>;

export function RemotePlayers({ room, region }: { room: Room; region: FamilyRegion }) {
  const now = Date.now();
  return (
    <>
      {visibleRemotes(room.remotes, region).map((r) => {
        const p = drawPosition(r, now);
        return (
          <div
            key={r.msg.id}
            className={`adv-player hj-remote${r.msg.moving ? " walking" : ""}`}
            style={{ left: p.x, top: p.y, zIndex: 4 }}
            data-remote={r.msg.nick}
          >
            {r.msg.emote && <span className="hj-remote-emote">{r.msg.emote}</span>}
            <div style={{ transform: `scaleX(${r.msg.facing})` }}>
              <PlayerAvatar outfit={r.msg.outfit} moving={r.msg.moving} />
            </div>
            <b>{r.msg.nick}</b>
          </div>
        );
      })}
    </>
  );
}

export function FamilyRoomPanel({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const count = Math.max(room.people, Object.keys(room.remotes).length + (room.code ? 1 : 0));
  return (
    <>
      <button className="hj-family-toggle" onClick={() => setOpen((v) => !v)}>
        👨‍👩‍👧 {room.code ? `가족방 ${count}명` : "가족방"}
      </button>
      {open && (
        <div className="hj-family-panel" role="group" aria-label="가족방">
          <b>나는 누구?</b>
          <div>
            {NICKNAMES.map((n) => (
              <button key={n} aria-pressed={room.nick === n} onClick={() => room.setNick(n)}>
                {n}
              </button>
            ))}
          </div>
          {room.code ? (
            <>
              <p>
                방 코드 <strong>{room.code}</strong>
              </p>
              <div>
                {EMOTES.map((e) => (
                  <button key={e} aria-label={`인사 ${e}`} onClick={() => room.sendEmote(e)}>
                    {e}
                  </button>
                ))}
              </div>
              <button onClick={room.leave}>방 나가기</button>
            </>
          ) : (
            <>
              <button onClick={() => room.create()}>방 만들기</button>
              <div>
                <input
                  value={input}
                  maxLength={6}
                  placeholder="방 코드 6자리"
                  aria-label="방 코드"
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                />
                <button onClick={() => room.join(input)}>들어가기</button>
              </div>
            </>
          )}
          {room.error && <p role="alert">{room.error}</p>}
          <small>
            {room.mode === "local"
              ? "인터넷 연결이 안 돼서 같은 기기의 창끼리만 만나요."
              : "같은 방 코드를 넣으면 다른 휴대폰·태블릿에서도 만나요 (최대 4명)."}
          </small>
        </div>
      )}
    </>
  );
}
