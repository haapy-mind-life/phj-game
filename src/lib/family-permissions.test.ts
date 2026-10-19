import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("family RLS permits only an enrolled user and their family channel", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role anon; create schema auth; create schema realtime;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function realtime.topic() returns text language sql stable as $$select current_setting('request.realtime.topic',true)$$;
   create table realtime.messages(topic text,extension text);
   alter table realtime.messages enable row level security;
   grant usage on schema public,auth,realtime to authenticated,anon;
   grant select,insert on realtime.messages to authenticated;
  `);
    const sql = await readFile(
      new URL("../../supabase/migrations/202610200001_family_room.sql", import.meta.url),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    await db.exec(`insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
   insert into public.family_members values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','아빠'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','엄마');
   set role authenticated;
   select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
  `);
    assert.equal((await db.query("select * from public.family_members")).rows.length, 1);
    await assert.rejects(
      db.exec("update public.family_members set nickname='누나'"),
      /permission denied/i,
    );
    await db.exec(
      "select set_config('request.realtime.topic','family:11111111-1111-4111-8111-111111111111:ABC234',false)",
    );
    await db.exec(
      "insert into realtime.messages values ('family:11111111-1111-4111-8111-111111111111:ABC234','broadcast')",
    );
    assert.equal((await db.query("select * from realtime.messages")).rows.length, 1);
    await db.exec(
      "select set_config('request.realtime.topic','family:22222222-2222-4222-8222-222222222222:ABC234',false)",
    );
    assert.equal((await db.query("select * from realtime.messages")).rows.length, 0);
    await assert.rejects(
      db.exec("insert into realtime.messages values ('other','broadcast')"),
      /row-level security/i,
    );
    await db.exec(
      "select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false)",
    );
    assert.equal((await db.query("select * from public.family_members")).rows.length, 0);
    await assert.rejects(
      db.exec("insert into realtime.messages values ('other','presence')"),
      /row-level security/i,
    );
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.exec("select * from public.family_members"), /permission denied/i);
  } finally {
    await db.close();
  }
});
