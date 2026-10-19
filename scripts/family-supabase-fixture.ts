// Local contract fixture, NOT Supabase or a deployable authentication server.
// Exercises the installed SDK over HTTP/WebSocket; real project RLS is checked separately.
import type { ServerWebSocket } from "bun";
const port = Number(process.env["PHJ_FIXTURE_PORT"] ?? 4194);
const family = "11111111-1111-4111-8111-111111111111";
const users = [
  ["dad", "아빠"],
  ["mom", "엄마"],
  ["sister", "누나"],
  ["hyunjun", "현준"],
  ["other", "아빠"],
  ["unlisted", "누나"],
].map(([name, nick], i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  email: `${name}@phj-game.invalid`,
  nick,
  family: i === 4 ? "22222222-2222-4222-8222-222222222222" : family,
  member: i !== 5,
}));
type Join = {
  topic: string;
  key: string;
  joinRef: string | null;
  meta: Record<string, unknown> | null;
  ws: Socket;
};
type Socket = ServerWebSocket<{ channels: Map<string, Join> }>;
const rooms = new Map<string, Set<Join>>();
const stats = { joins: 0, broadcasts: 0, tracks: 0 };
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer,accept,range,accept-profile,content-profile,x-retry-count",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};
function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: cors });
}
function decodeToken(token: string) {
  try {
    return users.find(
      (u) =>
        u.id === JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString()).sub,
    );
  } catch {
    return undefined;
  }
}
function account(u: (typeof users)[number]) {
  return {
    id: u.id,
    email: u.email,
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
  };
}
function session(u: (typeof users)[number]) {
  const now = Math.floor(Date.now() / 1000),
    encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return {
    access_token: [
      encode({ alg: "HS256", typ: "JWT" }),
      encode({
        sub: u.id,
        email: u.email,
        role: "authenticated",
        aud: "authenticated",
        iat: now,
        exp: now + 3600,
      }),
      "fixture-only",
    ].join("."),
    refresh_token: "refresh-" + u.id,
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: "bearer",
    user: account(u),
  };
}
type Message = {
  join_ref: string | null;
  ref: string | null;
  topic: string;
  event: string;
  payload: {
    access_token?: string;
    config?: { private?: boolean; presence?: { key?: string } };
    event?: string;
    payload?: Record<string, unknown>;
  };
};
function decode(raw: string | Buffer): Message {
  if (typeof raw === "string") {
    const m = JSON.parse(raw);
    if (Array.isArray(m)) {
      const [join_ref, ref, topic, event, payload] = m;
      return { join_ref, ref, topic, event, payload };
    }
    return m;
  }
  const bytes = new Uint8Array(raw);
  if (bytes[0] !== 3) throw Error("Unexpected fixture frame");
  let offset = 7;
  const text = new TextDecoder(),
    parts = [];
  for (let i = 1; i <= 5; i++) {
    const length = bytes[i]!;
    parts.push(text.decode(bytes.slice(offset, offset + length)));
    offset += length;
  }
  const [join_ref, ref, topic, event] = parts;
  return {
    join_ref: join_ref || null,
    ref: ref || null,
    topic: topic!,
    event: "broadcast",
    payload: { event: event!, payload: JSON.parse(text.decode(bytes.slice(offset))) },
  };
}
function send(
  ws: Socket,
  topic: string,
  event: string,
  payload: unknown,
  ref: string | null = null,
  joinRef: string | null = null,
) {
  try {
    ws.send(JSON.stringify([joinRef, ref, topic, event, payload]));
  } catch {
    /* fixture peer closed */
  }
}
function reply(ws: Socket, m: Message, status = "ok", response: unknown = {}) {
  send(ws, m.topic, "phx_reply", { status, response }, m.ref, m.join_ref);
}
function emit(topic: string, event: string, payload: unknown, except?: Socket) {
  for (const j of rooms.get(topic) ?? [])
    if (j.ws !== except) send(j.ws, topic, event, payload, null, j.joinRef);
}
function state(topic: string) {
  return Object.fromEntries(
    [...(rooms.get(topic) ?? [])].filter((j) => j.meta).map((j) => [j.key, { metas: [j.meta] }]),
  );
}
function remove(j: Join) {
  if (j.meta) {
    const meta = j.meta;
    j.meta = null;
    emit(j.topic, "presence_diff", { joins: {}, leaves: { [j.key]: { metas: [meta] } } }, j.ws);
  }
  rooms.get(j.topic)?.delete(j);
  j.ws.data.channels.delete(j.topic);
}
const server = Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(req, srv) {
    const u = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (u.pathname === "/realtime/v1/websocket") {
      if (srv.upgrade(req, { data: { channels: new Map() } })) return;
      return json({ error: "upgrade required" }, 400);
    }
    if (u.pathname === "/__fixture/stats") return json(stats);
    if (u.pathname === "/__fixture/disconnect" && req.method === "POST") {
      for (const room of rooms.values())
        for (const j of [...room]) j.ws.close(1012, "fixture reconnect");
      return json({ ok: true });
    }
    if (u.pathname === "/auth/v1/token" && req.method === "POST") {
      const body = (await req.json()) as Record<string, string>;
      const user =
        u.searchParams.get("grant_type") === "refresh_token"
          ? users.find((x) => body["refresh_token"] === "refresh-" + x.id)
          : users.find((x) => body["email"] === x.email && body["password"] === "246813");
      return user
        ? json(session(user))
        : json(
            {
              error: "invalid_grant",
              error_description: "Fixture credentials invalid",
              code: "invalid_credentials",
            },
            400,
          );
    }
    const user = decodeToken((req.headers.get("authorization") ?? "").replace(/^Bearer /i, ""));
    if (u.pathname === "/auth/v1/logout") return json({});
    if (u.pathname === "/auth/v1/user")
      return user ? json(account(user)) : json({ error: "not authorized" }, 401);
    if (u.pathname === "/rest/v1/family_members")
      return user
        ? json(user.member ? [{ family_id: user.family, nickname: user.nick }] : [])
        : json({ message: "not authorized" }, 401);
    return json({ error: "unknown fixture route" }, 404);
  },
  websocket: {
    open() {},
    message(ws, raw) {
      try {
        const m = decode(raw);
        if (m.event === "heartbeat") {
          reply(ws, m);
          return;
        }
        if (m.event === "phx_join") {
          const user = decodeToken(m.payload["access_token"] ?? "");
          if (
            !user?.member ||
            !m.payload["config"]?.private ||
            !m.topic.startsWith("realtime:family:" + user.family + ":")
          ) {
            reply(ws, m, "error", { reason: "not authorized" });
            return;
          }
          const j: Join = {
            topic: m.topic,
            key: m.payload["config"]?.presence?.key ?? crypto.randomUUID(),
            joinRef: m.join_ref,
            meta: null,
            ws,
          };
          ws.data.channels.set(m.topic, j);
          if (!rooms.has(m.topic)) rooms.set(m.topic, new Set());
          rooms.get(m.topic)!.add(j);
          stats.joins++;
          reply(ws, m);
          send(ws, m.topic, "presence_state", state(m.topic), null, m.join_ref);
          return;
        }
        const j = ws.data.channels.get(m.topic);
        if (!j) {
          reply(ws, m, "error");
          return;
        }
        if (m.event === "phx_leave") {
          remove(j);
          reply(ws, m);
          return;
        }
        if (m.event === "presence") {
          if (m.payload["event"] === "track") {
            const old = j.meta;
            j.meta = { ...m.payload["payload"], phx_ref: crypto.randomUUID() };
            stats.tracks++;
            reply(ws, m);
            emit(m.topic, "presence_diff", {
              joins: { [j.key]: { metas: [j.meta] } },
              leaves: old ? { [j.key]: { metas: [old] } } : {},
            });
          } else {
            if (j.meta) {
              const old = j.meta;
              j.meta = null;
              emit(m.topic, "presence_diff", { joins: {}, leaves: { [j.key]: { metas: [old] } } });
            }
            reply(ws, m);
          }
          return;
        }
        if (m.event === "broadcast") {
          stats.broadcasts++;
          reply(ws, m);
          emit(m.topic, "broadcast", m.payload, ws);
          return;
        }
        if (m.event === "access_token") {
          reply(ws, m);
          return;
        }
      } catch (error) {
        console.error("fixture protocol error", error instanceof Error ? error.message : "unknown");
      }
    },
    close(ws) {
      for (const j of [...ws.data.channels.values()]) remove(j);
    },
  },
});
console.log(`Local Supabase contract fixture: http://127.0.0.1:${server.port}`);
