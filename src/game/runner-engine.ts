import { stageForScore } from "./progression.ts";
import type { PlayerCombatState } from "./types.ts";
export type RunMode = "easy" | "challenge";
export type RunPhase = "ready" | "running" | "paused" | "clear" | "over";
export type Activity =
  "none" | "ladder-ready" | "ladder-up" | "ladder-top" | "ladder-down" | "crane";
export type Hazard = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "bush" | "puddle";
};
export type Pickup = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "coin" | "mushroom" | "box";
};
export type FriendlyEnemy = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "ground" | "air";
};
export type StarShot = { id: number; x: number; y: number; vx: number };
export type Run = {
  mode: RunMode;
  phase: RunPhase;
  activity: Activity;
  stage: number;
  score: number;
  coins: number;
  speed: number;
  y: number;
  vy: number;
  jumps: number;
  time: number;
  accumulator: number;
  invincible: number;
  combat: PlayerCombatState;
  ladderDone: boolean;
  craneDone: boolean;
  activityTime: number;
  clawX: number;
  clawY: number;
  clawDir: number;
  clawDropping: boolean;
  craneMisses: number;
  hint: string;
  hazards: Hazard[];
  pickups: Pickup[];
  enemies: FriendlyEnemy[];
  projectiles: StarShot[];
  nextId: number;
  hazardClock: number;
  coinClock: number;
  enemyClock: number;
  fireClock: number;
  nextPower: number;
  rng: number;
};
export const GROUND = 350,
  WIDTH = 800,
  HEIGHT = 440,
  PLAYER_X = 125;
export const STAGE_NAMES = ["새싹 들판", "방울 숲", "비밀 사다리", "구름 여행", "곰돌이 축제"];
function random(r: Run) {
  r.rng = (Math.imul(r.rng, 1664525) + 1013904223) >>> 0;
  return r.rng / 4294967296;
}
export function createRun(mode: RunMode = "easy"): Run {
  return {
    mode,
    phase: "running",
    activity: "none",
    stage: 1,
    score: 0,
    coins: 0,
    speed: mode === "easy" ? 168 : 248,
    y: GROUND,
    vy: 0,
    jumps: 0,
    time: 0,
    accumulator: 0,
    invincible: 0,
    combat: {
      armor: mode === "easy" ? 5 : 3,
      bullets: 60,
      arrows: 18,
      bananas: 0,
      disguised: false,
      flying: false,
      giantTimer: 0,
    },
    ladderDone: false,
    craneDone: false,
    activityTime: 0,
    clawX: 290,
    clawY: 125,
    clawDir: 1,
    clawDropping: false,
    craneMisses: 0,
    hint: "톡! 누르면 폴짝. 한 번 더 누르면 더 높이!",
    hazards: [],
    pickups: [],
    enemies: [],
    projectiles: [],
    nextId: 1,
    hazardClock: 3,
    coinClock: 0.8,
    enemyClock: 3,
    fireClock: 0,
    nextPower: 250,
    rng: 8128,
  };
}
export function hitRun(r: Run) {
  if (r.phase !== "running" || r.invincible > 0) return;
  if (r.mode === "easy") {
    r.combat.armor = Math.max(1, r.combat.armor - 1);
    r.invincible = 1.5;
    r.hint = "괜찮아! 반짝 보호막이 도와줄게.";
    return;
  }
  if (r.combat.armor > 0) {
    r.combat.armor--;
    r.invincible = 1.2;
    r.hint = "하트가 하나 줄었지만 계속 달릴 수 있어!";
    return;
  }
  r.phase = "over";
  r.hint = "오늘 모험도 멋졌어. 다시 달려도 좋아!";
}
export function tapRun(r: Run) {
  if (r.phase !== "running") return;
  if (r.activity === "crane") {
    r.clawDropping = true;
    return;
  }
  if (r.activity === "ladder-ready") {
    r.activity = "ladder-up";
    r.activityTime = 0;
    return;
  }
  if (r.activity === "ladder-top") {
    r.activity = "ladder-down";
    r.activityTime = 0;
    return;
  }
  if (r.activity !== "none") return;
  if (r.combat.flying) {
    r.vy = -225;
    return;
  }
  if (r.jumps < 2) {
    r.vy = r.jumps === 0 ? -500 : -420;
    r.jumps++;
  }
}
function beginActivity(r: Run, a: Activity) {
  r.activity = a;
  r.activityTime = 0;
  r.hazards = [];
  r.enemies = [];
  r.projectiles = [];
  r.vy = 0;
}
function activityStep(r: Run, dt: number) {
  r.activityTime += dt;
  if (r.activity === "ladder-ready") {
    r.hint = "비밀 사다리! 톡 누르면 올라가요.";
    if (r.mode === "easy" && r.activityTime > 2.4) tapRun(r);
  } else if (r.activity === "ladder-up") {
    r.y = Math.max(130, r.y - 160 * dt);
    if (r.y <= 130) {
      r.activity = "ladder-top";
      r.activityTime = 0;
      r.coins += 5;
      r.hint = "구름 보물 +5! 톡 누르면 내려가요.";
    }
  } else if (r.activity === "ladder-top") {
    if (r.mode === "easy" && r.activityTime > 1.2) tapRun(r);
  } else if (r.activity === "ladder-down") {
    r.y = Math.min(GROUND, r.y + 180 * dt);
    if (r.y >= GROUND) {
      r.activity = "none";
      r.ladderDone = true;
      r.hint = "사다리 탐험 성공! 다시 폴짝폴짝.";
    }
  } else if (r.activity === "crane") {
    r.hint = "곰돌이 위에서 톡! 선물을 잡아보자.";
    if (!r.clawDropping) {
      r.clawX += r.clawDir * 90 * dt;
      if (r.clawX >= 565) r.clawDir = -1;
      if (r.clawX <= 270) r.clawDir = 1;
      if (r.mode === "easy" && r.activityTime > 2 && Math.abs(r.clawX - 420) < 50)
        r.clawDropping = true;
    } else {
      r.clawY += 210 * dt;
      if (r.clawY >= 292) {
        if (Math.abs(r.clawX - 420) < (r.mode === "easy" ? 100 : 50) || r.craneMisses >= 2) {
          r.coins += 10;
          r.craneDone = true;
          r.activity = "none";
          r.hint = "곰돌이 선물 +10! 이제 결승선으로!";
        } else {
          r.craneMisses++;
          r.clawDropping = false;
          r.clawY = 125;
          r.hint = "다시 해도 괜찮아. 기회는 계속 있어!";
        }
      }
    }
  }
}
function collect(r: Run, p: Pickup) {
  if (p.kind === "coin") r.coins += 2;
  else if (p.kind === "mushroom") {
    r.combat.giantTimer = 480;
    r.hint = "쑥쑥 버섯! 커다란 나로 변신!";
  } else {
    r.combat.disguised = true;
    r.combat.bananas += 5;
    r.hint = "바나나 친구가 모험을 도와줘!";
  }
  p.x = -100;
}
function fixedStep(r: Run, dt: number) {
  r.time += dt;
  r.invincible = Math.max(0, r.invincible - dt);
  r.combat.giantTimer = Math.max(0, r.combat.giantTimer - 1);
  if (r.activity !== "none") {
    activityStep(r, dt);
    return;
  }
  r.score = Math.min(1000, r.score + 20 * dt);
  const stage = stageForScore(r.score);
  if (stage.id === "clear") {
    r.phase = "clear";
    r.score = 1000;
    r.hint = "완주했어! 정말 멋져!";
    return;
  }
  if (stage.id !== r.stage) {
    r.stage = stage.id;
    r.hint = STAGE_NAMES[r.stage - 1] + "에 도착했어!";
    if (r.stage === 3 && !r.ladderDone) {
      beginActivity(r, "ladder-ready");
      return;
    }
    if (r.stage === 4) {
      r.combat.flying = true;
      r.y = Math.min(r.y, 245);
      r.vy = 0;
    }
    if (r.stage === 5 && !r.craneDone) {
      r.combat.flying = false;
      r.y = GROUND;
      beginActivity(r, "crane");
      return;
    }
  }
  if (r.combat.flying) {
    r.vy += 300 * dt;
    r.vy = Math.min(r.vy, 120);
    r.y = Math.max(100, Math.min(GROUND - 45, r.y + r.vy * dt));
    if (r.mode === "easy" && r.y > 245) r.vy = -110;
  } else {
    r.vy += 1100 * dt;
    r.y = Math.min(GROUND, r.y + r.vy * dt);
    if (r.y >= GROUND) {
      r.y = GROUND;
      r.vy = 0;
      r.jumps = 0;
    }
  }
  r.hazardClock -= dt;
  r.coinClock -= dt;
  r.enemyClock -= dt;
  r.fireClock -= dt;
  if (r.hazardClock <= 0) {
    r.hazards.push({
      id: r.nextId++,
      x: WIDTH + 40,
      y: GROUND - 32,
      w: 42,
      h: 32,
      kind: random(r) < 0.5 ? "bush" : "puddle",
    });
    r.hazardClock = r.mode === "easy" ? 3.7 : 2.2;
  }
  if (r.coinClock <= 0) {
    r.pickups.push({
      id: r.nextId++,
      x: WIDTH + 30,
      y: r.combat.flying ? 210 : GROUND - 46,
      w: 28,
      h: 28,
      kind: "coin",
    });
    r.coinClock = 1.25;
  }
  if (r.score >= r.nextPower) {
    r.pickups.push({
      id: r.nextId++,
      x: WIDTH + 15,
      y: r.combat.flying ? 210 : GROUND - 42,
      w: 34,
      h: 34,
      kind: r.nextPower === 500 ? "box" : "mushroom",
    });
    r.nextPower += 250;
  }
  for (const h of r.hazards) h.x -= r.speed * dt;
  if (
    r.mode === "easy" &&
    !r.combat.flying &&
    r.jumps === 0 &&
    r.hazards.some((h) => h.x > PLAYER_X && h.x < PLAYER_X + 120)
  )
    tapRun(r);
  for (const h of r.hazards) {
    const near = h.x < PLAYER_X + 28 && h.x + h.w > PLAYER_X - 18;
    if (near && r.y > h.y + 10 && !r.combat.flying) {
      hitRun(r);
      h.x = -100;
    }
  }
  r.hazards = r.hazards.filter((h) => h.x > -60);
  for (const p of r.pickups) {
    p.x -= r.speed * dt;
    if (Math.hypot(p.x - PLAYER_X, p.y - (r.y - 35)) < (r.mode === "easy" ? 95 : 55)) collect(r, p);
  }
  r.pickups = r.pickups.filter((p) => p.x > -60);
  if (r.stage >= 2 && r.enemyClock <= 0) {
    r.enemies.push({
      id: r.nextId++,
      kind: r.combat.flying ? "air" : "ground",
      x: WIDTH + 40,
      y: r.combat.flying ? 210 : GROUND - 40,
      w: 42,
      h: 40,
    });
    r.enemyClock = r.mode === "easy" ? 4.2 : 3;
  }
  for (const e of r.enemies) e.x -= r.speed * 0.85 * dt;
  if (r.fireClock <= 0 && r.enemies.some((e) => e.x > PLAYER_X && e.x < PLAYER_X + 420)) {
    r.projectiles.push({ id: r.nextId++, x: PLAYER_X + 28, y: r.y - 35, vx: 560 });
    r.fireClock = 0.55;
  }
  for (const p of r.projectiles) p.x += p.vx * dt;
  for (const p of r.projectiles) {
    const enemy = r.enemies.find((e) => Math.abs(e.x - p.x) < 30 && Math.abs(e.y - p.y) < 45);
    if (enemy) {
      enemy.x = -100;
      p.x = WIDTH + 100;
      r.coins += 1;
    }
  }
  for (const e of r.enemies) {
    if (Math.abs(e.x - PLAYER_X) < 34 && Math.abs(e.y - (r.y - 36)) < 45) {
      if (r.combat.disguised || r.combat.giantTimer > 0) e.x = -100;
      else {
        hitRun(r);
        e.x = -100;
      }
    }
  }
  r.enemies = r.enemies.filter((e) => e.x > -60);
  r.projectiles = r.projectiles.filter((p) => p.x < WIDTH + 60);
}
export function advanceRun(r: Run, seconds: number) {
  if (r.phase !== "running") {
    r.accumulator = 0;
    return;
  }
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  r.accumulator += Math.min(seconds, 0.1);
  while (r.accumulator >= 1 / 60 - 1e-9 && r.phase === "running") {
    r.accumulator -= 1 / 60;
    fixedStep(r, 1 / 60);
  }
}
export function finishRun(r: Run) {
  const clear = r.phase === "clear";
  if (!clear) r.phase = "over";
  return { score: Math.floor(r.score), coins: r.coins, clear };
}
