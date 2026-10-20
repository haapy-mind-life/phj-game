import { familyIdentity } from "@/game/family-identity";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  EMOTES,
  NICKNAMES,
  drawPosition,
  visibleRemotes,
  type FamilyRegion,
  type Nickname,
} from "@/game/family-room";
import { screenPoint } from "@/game/world-space";
import type { Point } from "@/game/adventure";
import type { useFamilyRoom } from "./useFamilyRoom";
import { PlayerAvatar } from "./PlayerAvatar";
type Room = ReturnType<typeof useFamilyRoom>;
const LOGIN_EMAIL: Record<Nickname, string> = {
  현준: "hyunjun@phj-game.invalid",
  아빠: "dad@phj-game.invalid",
  엄마: "mom@phj-game.invalid",
  누나: "sister@phj-game.invalid",
};
const LOGIN_NAME_KEY = "hj-family-login-name";
function rememberedLoginName(): Nickname {
  try {
    const saved = localStorage.getItem(LOGIN_NAME_KEY);
    return NICKNAMES.find((n) => n === saved) ?? "현준";
  } catch {
    return "현준";
  }
}
export function RemotePlayers({
  room,
  region,
  player,
}: {
  room: Room;
  region: FamilyRegion;
  player: Point;
}) {
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const latest = useRef({ remotes: room.remotes, player });
  latest.current = { remotes: room.remotes, player };
  const hasRemotes = visibleRemotes(room.remotes, region).length > 0;
  useEffect(() => {
    if (!hasRemotes) return;
    let frame = 0;
    const animate = () => {
      const now = Date.now(),
        current = latest.current;
      for (const [id, node] of nodes.current) {
        const remote = current.remotes[id];
        if (!remote) continue;
        const p = screenPoint(drawPosition(remote, now), current.player);
        const x = `${p.x}px`,
          y = `${p.y}px`;
        if (node.style.left !== x) node.style.left = x;
        if (node.style.top !== y) node.style.top = y;
        const emote = node.querySelector<HTMLElement>(".hj-remote-emote");
        if (emote && now - remote.seenAt >= 2000) emote.style.display = "none";
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hasRemotes]);
  const now = Date.now();
  return (
    <>
      {visibleRemotes(room.remotes, region).map((r) => {
        const p = screenPoint(drawPosition(r, now), player);
        return (
          <div
            key={r.msg.id}
            ref={(node) => {
              if (node) nodes.current.set(r.msg.id, node);
              else nodes.current.delete(r.msg.id);
            }}
            className={`adv-player hj-remote${r.msg.moving ? " walking" : ""}`}
            style={{ left: p.x, top: p.y, zIndex: 4 }}
            data-remote={r.msg.nick}
          >
            {r.msg.emote && now - r.seenAt < 2000 && (
              <span className="hj-remote-emote">{r.msg.emote}</span>
            )}
            <div style={{ transform: `scaleX(${r.msg.facing})` }}>
              <PlayerAvatar
                identity={familyIdentity(r.msg.nick).id}
                outfit={r.msg.outfit}
                moving={r.msg.moving}
              />
            </div>
            <b>{r.msg.nick}</b>
          </div>
        );
      })}
    </>
  );
}
const statusLabel = {
  connecting: "가족방 연결 중",
  connected: "가족과 연결됐어요",
  reconnecting: "연결을 다시 확인하고 있어요",
  disconnected: "연결이 끊겼어요. 혼자 놀기는 계속돼요",
  full: "가족방에 네 명이 있어요",
};
export function FamilyRoomPanel({ room }: { room: Room }) {
  const [open, setOpen] = useState(false),
    [loginName, setLoginName] = useState<Nickname>(rememberedLoginName),
    [showPassword, setShowPassword] = useState(false),
    [password, setPassword] = useState("");
  const account = room.account,
    online = account.mode === "supabase",
    canJoin = account.mode === "local" || account.status === "ready";
  const count = Object.keys(room.remotes).length + (room.participating ? 1 : 0);
  const pendingLogin = useRef(false);
  useEffect(() => {
    if (pendingLogin.current && account.status === "ready" && room.status === "connected") {
      pendingLogin.current = false;
      setOpen(false);
    }
  }, [account.status, room.status]);
  async function login(e: FormEvent) {
    e.preventDefault();
    pendingLogin.current = true;
    try {
      if (!(await account.signIn(LOGIN_EMAIL[loginName], password))) pendingLogin.current = false;
    } finally {
      setPassword("");
      setShowPassword(false);
    }
  }
  return (
    <>
      <button className="hj-family-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        👨‍👩‍👧{" "}
        {room.participating
          ? room.status === "connected"
            ? `가족 ${count}명`
            : "가족 연결 중"
          : online
            ? "가족 로그인"
            : "함께 놀기"}
      </button>
      {open && (
        <section className="hj-family-panel" role="group" aria-label="가족과 함께">
          <header>
            <b>함께 놀기</b>
            <button onClick={() => setOpen(false)} aria-label="가족방 닫기">
              닫기 ✕
            </button>
          </header>
          {account.mode === "invalid" ? (
            <p role="alert">
              부모님이 가족방 연결 설정을 확인해 주세요. 혼자 놀기는 계속할 수 있어요.
            </p>
          ) : (
            <>
              {online ? (
                <>
                  {account.status === "loading" ? (
                    <p role="status">가족 계정을 확인하고 있어요…</p>
                  ) : account.status === "ready" ? (
                    <p>🔒 {room.nick}의 가족 전용 공간</p>
                  ) : account.status === "not-member" || account.status === "error" ? (
                    <>
                      <p role="alert">{account.error}</p>
                      <button onClick={() => void account.retry()}>다시 확인</button>
                      <button
                        onClick={() => {
                          room.leave();
                          void account.signOut();
                        }}
                      >
                        다른 계정으로 로그인
                      </button>
                    </>
                  ) : (
                    <form
                      onSubmit={login}
                      className="family-login"
                      aria-label="부모님 가족 계정 로그인"
                    >
                      <p>가족을 고르고 쉬운 숫자 암호 4자리만 입력해 주세요.</p>
                      <div className="family-login-names" role="group" aria-label="로그인할 가족">
                        {NICKNAMES.map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={loginName === n}
                            disabled={account.busy}
                            onClick={() => {
                              setLoginName(n);
                              setPassword("");
                              setShowPassword(false);
                              try {
                                localStorage.setItem(LOGIN_NAME_KEY, n);
                              } catch {
                                // Family selection still works when storage is unavailable.
                              }
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <input
                        type="hidden"
                        name="username"
                        autoComplete="username"
                        value={LOGIN_EMAIL[loginName]}
                      />
                      <label htmlFor="family-login-password">암호</label>
                      <span className="family-password-entry">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="family-login-password"
                          name="password"
                          autoComplete="current-password"
                          inputMode="numeric"
                          pattern="[0-9]{4}([0-9]{2})?"
                          minLength={4}
                          maxLength={6}
                          placeholder="숫자 4자리"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "암호 숨기기" : "암호 보기"}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? "숨기기" : "보기"}
                        </button>
                      </span>
                      <small>한 번 로그인하면 이 기기에서 자동으로 접속해요.</small>
                      <button type="submit" disabled={account.busy}>
                        {account.busy ? "로그인 중…" : "가족 계정 로그인"}
                      </button>
                      {account.error && <p role="alert">{account.error}</p>}
                    </form>
                  )}
                </>
              ) : (
                <>
                  <p>같은 기기에서 연 창끼리 만나는 연습 모드예요.</p>
                  <b>나는 누구?</b>
                  <div>
                    {NICKNAMES.map((n) => (
                      <button
                        key={n}
                        aria-pressed={room.nick === n}
                        onClick={() => room.setNick(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {canJoin && (
                <>
                  <p role="status">{statusLabel[room.status]}</p>
                  <div>
                    {EMOTES.map((e) => (
                      <button
                        key={e}
                        aria-label={`인사 ${e}`}
                        disabled={room.status !== "connected"}
                        onClick={() => room.sendEmote(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  {(room.status === "disconnected" || room.status === "full") && (
                    <button onClick={() => room.reconnect()}>다시 연결</button>
                  )}
                  {room.error && <p role="alert">{room.error}</p>}
                  {online && (
                    <button
                      disabled={account.busy}
                      onClick={() => {
                        room.leave();
                        void account.signOut();
                      }}
                    >
                      이 기기 로그아웃
                    </button>
                  )}
                  <small>
                    로그인하면 가족과 자동으로 만나요. 지상 마을에서 서로 보고 인사해요.
                    돈·집·농장은 각자 저장돼요.
                  </small>
                </>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
