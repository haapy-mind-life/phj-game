import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import heroAsset from "@/assets/runner-hero.png.asset.json";
import {
  activateMushroom,
  fireProjectile,
  openMysteryBox,
  resolveEnemyContact,
  resolveProjectileHits,
} from "@/game/combat";
import {
  applyCraneReward,
  chooseAutoWeapon,
  resolveTapAction,
  stageForScore,
} from "@/game/progression";
import type { CraneReward } from "@/game/progression";
import type {
  CraneEncounter,
  Enemy,
  FlightItem,
  Ladder,
  Mushroom,
  MysteryBox,
  PlayerCombatState,
  Projectile,
} from "@/game/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "박현준 러너 - 한 손가락 모험" },
      {
        name: "description",
        content:
          "화면을 탭하며 달리고, 사다리를 오르고, 날고, 크레인 보물을 뽑아 1000점 완주에 도전하는 어린이 러너 게임입니다.",
      },
      { property: "og:title", content: "박현준 러너 - 한 손가락 모험" },
      {
        property: "og:description",
        content: "화면 탭 하나로 5단계를 모험하고 1000점 완주에 도전하세요.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Obstacle = { x: number; w: number; h: number };
type Cloud = { x: number; y: number; s: number; sp: number };
type Bird = { x: number; y: number; sp: number; f: number };
type Spring = { x: number; c: number };
type RainCloud = { x: number; y: number; w: number };
type Umbrella = { x: number; y: number; taken: boolean };
type LadderMode = "none" | "ready" | "up" | "top" | "down";

const W = 900;
const H = 340;
const GROUND = 280;
const GOAL = 1000;
const PLAYER_X = 120;
const PLAYER_W = 38;
const PLAYER_H = 46;
const LADDER_TOP_Y = 88;
const CRANE_REWARDS: CraneReward[] = ["banana", "armor", "coins", "treasure"];

const levelOf = (score: number) => Math.min(10, Math.floor(score / 100) + 1);

const makeClouds = (): Cloud[] =>
  Array.from({ length: 6 }, (_, i) => ({
    x: (i * 170 + Math.random() * 80) % W,
    y: 30 + Math.random() * 90,
    s: 0.6 + Math.random() * 0.8,
    sp: 0.25 + Math.random() * 0.5,
  }));

const makeBirds = (): Bird[] =>
  Array.from({ length: 3 }, (_, i) => ({
    x: i * 320 + Math.random() * 200,
    y: 40 + Math.random() * 90,
    sp: 1.1 + Math.random() * 1.1,
    f: Math.random() * 10,
  }));

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function Index() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroImg = useRef<HTMLImageElement | null>(null);
  const [state, setState] = useState<"ready" | "playing" | "over" | "clear">("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [money, setMoney] = useState(0);
  const [armor, setArmor] = useState(1);
  const [bullets, setBullets] = useState(12);
  const [arrows, setArrows] = useState(6);
  const [bananas, setBananas] = useState(0);
  const [disguised, setDisguised] = useState(false);
  const [flying, setFlying] = useState(false);
  const [giant, setGiant] = useState(false);
  const [stageFlash, setStageFlash] = useState("");
  const [hint, setHint] = useState("화면을 탭해서 시작!");

  const game = useRef({
    y: GROUND,
    vy: 0,
    obstacles: [] as Obstacle[],
    clouds: [] as Cloud[],
    birds: [] as Bird[],
    springs: [] as Spring[],
    rainClouds: [] as RainCloud[],
    umbrellas: [] as Umbrella[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    mushrooms: [] as Mushroom[],
    mysteryBoxes: [] as MysteryBox[],
    ladders: [] as Ladder[],
    flightItems: [] as FlightItem[],
    cranes: [] as CraneEncounter[],
    umbrella: 0,
    armor: 1,
    bullets: 12,
    arrows: 6,
    bananas: 0,
    disguised: false,
    flying: false,
    giantTimer: 0,
    nextId: 1,
    speed: 7,
    t: 0,
    score: 0,
    level: 1,
    stageId: 1 as number,
    running: false,
    money: 0,
    autoFireCooldown: 0,
    ladderMode: "none" as LadderMode,
    activeLadderId: 0,
    flightRespawnCooldown: 0,
    transformFlash: 0,
    craneActive: false,
    craneId: 0,
    craneCooldown: 0,
    clawX: 450,
    clawDir: 1,
    clawDropping: false,
    clawY: 58,
    cranePrizeX: 450,
    craneReward: "banana" as CraneReward,
  });

  const combatState = useCallback((): PlayerCombatState => {
    const g = game.current;
    return {
      armor: g.armor,
      bullets: g.bullets,
      arrows: g.arrows,
      bananas: g.bananas,
      disguised: g.disguised,
      flying: g.flying,
      giantTimer: g.giantTimer,
    };
  }, []);

  const syncInventory = useCallback(() => {
    const g = game.current;
    setArmor(g.armor);
    setBullets(g.bullets);
    setArrows(g.arrows);
    setBananas(g.bananas);
    setMoney(g.money);
    setDisguised(g.disguised);
    setFlying(g.flying);
  }, []);

  const start = useCallback(() => {
    const g = game.current;
    g.y = GROUND;
    g.vy = 0;
    g.obstacles = [];
    g.clouds = makeClouds();
    g.birds = makeBirds();
    g.springs = [];
    g.rainClouds = [];
    g.umbrellas = [];
    g.enemies = [];
    g.projectiles = [];
    g.mushrooms = [];
    g.mysteryBoxes = [];
    g.ladders = [];
    g.flightItems = [];
    g.cranes = [];
    g.umbrella = 0;
    g.armor = 1;
    g.bullets = 12;
    g.arrows = 6;
    g.bananas = 0;
    g.disguised = false;
    g.flying = false;
    g.giantTimer = 0;
    g.nextId = 1;
    g.speed = 7;
    g.t = 0;
    g.score = 0;
    g.level = 1;
    g.stageId = 1;
    g.running = true;
    g.money = 0;
    g.autoFireCooldown = 0;
    g.ladderMode = "none";
    g.activeLadderId = 0;
    g.flightRespawnCooldown = 0;
    g.transformFlash = 0;
    g.craneActive = false;
    g.craneId = 0;
    g.craneCooldown = 240;
    g.clawX = 450;
    g.clawDir = 1;
    g.clawDropping = false;
    g.clawY = 58;
    g.cranePrizeX = 450;
    g.craneReward = "banana";
    setScore(0);
    setMoney(0);
    setArmor(1);
    setBullets(12);
    setArrows(6);
    setBananas(0);
    setDisguised(false);
    setFlying(false);
    setGiant(false);
    setStageFlash("");
    setHint("화면을 탭해서 점프!");
    setState("playing");
  }, []);

  const handleTap = useCallback(() => {
    const g = game.current;
    if (!g.running) {
      start();
      return;
    }

    const action = resolveTapAction({
      craneActive: g.craneActive,
      ladderTop: g.ladderMode === "top",
      ladderReady: g.ladderMode === "ready",
      flying: g.flying,
    });

    if (action === "grab") {
      if (!g.clawDropping) g.clawDropping = true;
      return;
    }
    if (action === "descend") {
      g.ladderMode = "down";
      setHint("자동으로 내려가는 중...");
      return;
    }
    if (action === "climb") {
      g.ladderMode = "up";
      g.vy = 0;
      setHint("자동으로 올라가는 중...");
      return;
    }
    if (action === "fly") {
      g.vy = -7.4;
      return;
    }
    if (g.y >= GROUND - 1 && g.ladderMode === "none") g.vy = -15.5;
  }, [start]);

  useEffect(() => {
    try {
      const savedBest = Number(localStorage.getItem("runner-best") || 0);
      if (savedBest) setBest(savedBest);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = heroAsset.url;
    heroImg.current = img;
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const css = getComputedStyle(document.documentElement);
    const tok = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;

    const saveBest = (nextScore: number) =>
      setBest((currentBest) => {
        const nextBest = Math.max(currentBest, nextScore);
        try {
          localStorage.setItem("runner-best", String(nextBest));
        } catch {
          /* ignore */
        }
        return nextBest;
      });

    const gameOver = () => {
      const g = game.current;
      if (g.flying || g.disguised) return;
      g.running = false;
      setState("over");
      setHint("화면을 탭해서 다시 시작");
      saveBest(Math.floor(g.score));
    };

    const enterCrane = (crane: CraneEncounter) => {
      const g = game.current;
      g.craneActive = true;
      g.craneId = crane.id;
      g.clawX = 330;
      g.clawDir = 1;
      g.clawDropping = false;
      g.clawY = 58;
      g.cranePrizeX = 350 + Math.random() * 200;
      g.craneReward = CRANE_REWARDS[Math.floor(Math.random() * CRANE_REWARDS.length)];
      setHint("크레인! 원하는 위치에서 화면을 탭해서 잡기!");
    };

    const finishCrane = () => {
      const g = game.current;
      const result = applyCraneReward(combatState(), g.money, g.craneReward);
      g.armor = result.state.armor;
      g.bananas = result.state.bananas;
      g.money = result.money;
      g.cranes = g.cranes.filter((crane) => crane.id !== g.craneId);
      g.craneActive = false;
      g.craneId = 0;
      g.craneCooldown = 520;
      g.clawDropping = false;
      g.clawY = 58;
      syncInventory();
      setHint("화면을 탭해서 위로 날기!");
    };

    const updateCrane = () => {
      const g = game.current;
      if (!g.clawDropping) {
        g.clawX += 4.2 * g.clawDir;
        if (g.clawX >= 590) g.clawDir = -1;
        if (g.clawX <= 310) g.clawDir = 1;
        return;
      }

      g.clawY += 9;
      if (g.clawY < 215) return;
      if (Math.abs(g.clawX - g.cranePrizeX) <= 38) {
        finishCrane();
      } else {
        g.clawDropping = false;
        g.clawY = 58;
        setHint("아깝다! 다시 탭해서 잡기!");
      }
    };

    const updateLadder = () => {
      const g = game.current;
      if (g.ladderMode === "up") {
        g.y = Math.max(LADDER_TOP_Y, g.y - 5.5);
        if (g.y <= LADDER_TOP_Y) {
          g.y = LADDER_TOP_Y;
          g.ladderMode = "top";
          g.money += 3;
          setMoney(g.money);
          setHint("돈 +3! 화면을 탭해서 내려가기");
        }
        return true;
      }
      if (g.ladderMode === "top") return true;
      if (g.ladderMode === "down") {
        g.y = Math.min(GROUND, g.y + 5.5);
        if (g.y >= GROUND) {
          g.y = GROUND;
          g.ladders = g.ladders.filter((ladder) => ladder.id !== g.activeLadderId);
          g.activeLadderId = 0;
          g.ladderMode = "none";
          setHint("화면을 탭해서 점프!");
        }
        return true;
      }
      return g.ladderMode === "ready";
    };

    const loop = () => {
      const g = game.current;
      if (g.clouds.length === 0) g.clouds = makeClouds();
      if (g.birds.length === 0) g.birds = makeBirds();

      for (const cloud of g.clouds) {
        cloud.x -= cloud.sp;
        if (cloud.x < -160) {
          cloud.x = W + 60;
          cloud.y = 30 + Math.random() * 90;
        }
      }
      for (const bird of g.birds) {
        bird.x -= bird.sp;
        bird.f += 0.16;
        if (bird.x < -60) {
          bird.x = W + 60 + Math.random() * 300;
          bird.y = 40 + Math.random() * 90;
        }
      }

      if (g.running) {
        g.t += 1;
        if (g.transformFlash > 0) g.transformFlash -= 1;
        if (g.craneCooldown > 0) g.craneCooldown -= 1;
        if (g.flightRespawnCooldown > 0) g.flightRespawnCooldown -= 1;
        if (g.autoFireCooldown > 0) g.autoFireCooldown -= 1;
        if (g.umbrella > 0) g.umbrella -= 1;
        if (g.giantTimer > 0) {
          g.giantTimer -= 1;
          if (g.giantTimer === 0) setGiant(false);
        }

        if (g.craneActive) {
          updateCrane();
        } else if (!updateLadder()) {
          g.speed = 7 + g.t / 700 + (g.level - 1) * 0.7;
          if (g.flying) {
            g.vy += 0.34;
            g.vy = Math.min(g.vy, 5.2);
            g.y += g.vy;
            if (g.y < 16) {
              g.y = 16;
              if (g.vy < 0) g.vy = 0;
            }
            if (g.y > GROUND) {
              g.y = GROUND;
              if (g.vy > 0) g.vy = 0;
            }
          } else {
            g.vy += 0.78;
            g.y = Math.min(GROUND, g.y + g.vy);
            if (g.y < 6) {
              g.y = 6;
              if (g.vy < 0) g.vy = 0;
            }
          }

          const playerBox = { x: PLAYER_X, y: g.y, w: PLAYER_W, h: PLAYER_H };
          const currentStage = stageForScore(g.score);
          const stageNumber = currentStage.id === "clear" ? 5 : currentStage.id;

          const lastObstacle = g.obstacles[g.obstacles.length - 1];
          if ((!lastObstacle || lastObstacle.x < W - 340) && Math.random() < 0.012) {
            g.obstacles.push({
              x: W + 50,
              w: 24 + Math.random() * 10,
              h: 34 + Math.random() * 18,
            });
          }
          g.obstacles.forEach((obstacle) => (obstacle.x -= g.speed));
          g.obstacles = g.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -40);
          for (const obstacle of g.obstacles) {
            const hit =
              PLAYER_X + PLAYER_W > obstacle.x &&
              PLAYER_X < obstacle.x + obstacle.w &&
              g.y > GROUND - obstacle.h + 6;
            if (!hit) continue;
            if (g.disguised || g.flying) {
              g.obstacles = g.obstacles.filter((item) => item !== obstacle);
            } else {
              gameOver();
            }
            break;
          }

          const lastSpring = g.springs[g.springs.length - 1];
          if ((!lastSpring || lastSpring.x < W - 380) && Math.random() < 0.01) {
            g.springs.push({ x: W + 60, c: 0 });
          }
          g.springs.forEach((spring) => {
            spring.x -= g.speed;
            if (spring.c > 0) spring.c -= 1;
          });
          g.springs = g.springs.filter((spring) => spring.x > -60);
          if (!g.flying) {
            for (const spring of g.springs) {
              if (
                PLAYER_X + PLAYER_W > spring.x - 22 &&
                PLAYER_X < spring.x + 22 &&
                g.vy >= 0 &&
                g.y > GROUND - 34
              ) {
                spring.c = 12;
                g.vy = -21;
                g.y = GROUND - 34;
              }
            }
          }

          const lastRainCloud = g.rainClouds[g.rainClouds.length - 1];
          if ((!lastRainCloud || lastRainCloud.x < W - 420) && Math.random() < 0.006) {
            g.rainClouds.push({ x: W + 80, y: 42 + Math.random() * 38, w: 120 });
          }
          g.rainClouds.forEach((cloud) => (cloud.x -= g.speed * 0.9));
          g.rainClouds = g.rainClouds.filter((cloud) => cloud.x + cloud.w > -60);

          const lastUmbrella = g.umbrellas[g.umbrellas.length - 1];
          if ((!lastUmbrella || lastUmbrella.x < W - 480) && Math.random() < 0.004) {
            g.umbrellas.push({ x: W + 60, y: 150 + Math.random() * 70, taken: false });
          }
          g.umbrellas.forEach((umbrella) => (umbrella.x -= g.speed));
          g.umbrellas = g.umbrellas.filter((umbrella) => umbrella.x > -60 && !umbrella.taken);
          for (const umbrella of g.umbrellas) {
            if (Math.hypot(PLAYER_X + PLAYER_W / 2 - umbrella.x, g.y + 23 - umbrella.y) < 30) {
              umbrella.taken = true;
              g.umbrella = 600;
            }
          }

          for (const rainCloud of g.rainClouds) {
            const inX = PLAYER_X + PLAYER_W > rainCloud.x && PLAYER_X < rainCloud.x + rainCloud.w;
            const inRain = g.y + PLAYER_H > rainCloud.y + 24 && g.y < rainCloud.y + 170;
            if (inX && inRain && g.umbrella <= 0 && !g.disguised && !g.flying) {
              gameOver();
              break;
            }
          }

          if (stageNumber >= 2) {
            const lastEnemy = g.enemies[g.enemies.length - 1];
            if ((!lastEnemy || lastEnemy.x < W - 320) && Math.random() < 0.009) {
              const air = Math.random() < 0.35;
              g.enemies.push({
                id: g.nextId++,
                kind: air ? "air" : "ground",
                x: W + 60,
                y: air ? 120 + Math.random() * 70 : GROUND + 8,
                w: air ? 38 : 34,
                h: air ? 30 : 38,
                alive: true,
              });
            }
          }
          for (const enemy of g.enemies) {
            enemy.x -= g.speed * (enemy.kind === "air" ? 0.75 : 0.9);
          }
          g.enemies = g.enemies.filter((enemy) => enemy.x + enemy.w > -50);

          if (stageNumber >= 2 && g.autoFireCooldown <= 0) {
            const target = g.enemies.find(
              (enemy) => enemy.alive && enemy.x > PLAYER_X && enemy.x < PLAYER_X + 430,
            );
            const weapon = target ? chooseAutoWeapon(combatState()) : null;
            if (weapon) {
              const result = fireProjectile(combatState(), weapon, 158, g.y + 21);
              g.bullets = result.state.bullets;
              g.arrows = result.state.arrows;
              g.bananas = result.state.bananas;
              if (result.projectile) {
                result.projectile.id = g.nextId++;
                g.projectiles.push(result.projectile);
                g.autoFireCooldown = 34;
                syncInventory();
              }
            }
          }

          const lastMushroom = g.mushrooms[g.mushrooms.length - 1];
          if ((!lastMushroom || lastMushroom.x < W - 520) && Math.random() < 0.002) {
            g.mushrooms.push({
              id: g.nextId++,
              x: W + 50,
              y: GROUND + 16,
              w: 28,
              h: 30,
            });
          }
          for (const mushroom of g.mushrooms) mushroom.x -= g.speed * 0.9;
          g.mushrooms = g.mushrooms.filter((mushroom) => mushroom.x + mushroom.w > -40);
          for (const mushroom of g.mushrooms) {
            if (!overlaps(playerBox, mushroom)) continue;
            const next = activateMushroom(combatState());
            g.giantTimer = next.giantTimer;
            setGiant(true);
            g.mushrooms = g.mushrooms.filter((item) => item.id !== mushroom.id);
            break;
          }

          if (stageNumber >= 2) {
            const lastBox = g.mysteryBoxes[g.mysteryBoxes.length - 1];
            if ((!lastBox || lastBox.x < W - 650) && Math.random() < 0.0018) {
              g.mysteryBoxes.push({
                id: g.nextId++,
                x: W + 50,
                y: GROUND + 8,
                w: 38,
                h: 38,
                opened: false,
              });
            }
          }
          for (const box of g.mysteryBoxes) box.x -= g.speed * 0.85;
          g.mysteryBoxes = g.mysteryBoxes.filter((box) => box.x + box.w > -50 && !box.opened);
          for (const box of g.mysteryBoxes) {
            if (!overlaps(playerBox, box)) continue;
            box.opened = true;
            const next = openMysteryBox(combatState());
            g.bananas = next.bananas;
            g.disguised = next.disguised;
            g.mysteryBoxes = g.mysteryBoxes.filter((item) => item.id !== box.id);
            syncInventory();
            break;
          }

          if (stageNumber === 3 && !g.flying && g.ladderMode === "none") {
            const lastLadder = g.ladders[g.ladders.length - 1];
            if ((!lastLadder || lastLadder.x < W - 620) && Math.random() < 0.004) {
              g.ladders.push({
                id: g.nextId++,
                x: W + 40,
                y: LADDER_TOP_Y + 42,
                w: 54,
                h: GROUND - LADDER_TOP_Y,
                used: false,
              });
            }
          }
          for (const ladder of g.ladders) ladder.x -= g.speed * 0.75;
          g.ladders = g.ladders.filter((ladder) => ladder.x + ladder.w > -60 && !ladder.used);
          if (g.ladderMode === "none") {
            const ladder = g.ladders.find(
              (item) => item.x <= PLAYER_X + 54 && item.x + item.w >= PLAYER_X - 10,
            );
            if (ladder) {
              g.ladderMode = "ready";
              g.activeLadderId = ladder.id;
              setHint("비밀 사다리! 화면을 탭해서 올라가기");
            }
          }

          if (g.score >= 600 && !g.flying) {
            if (g.flightItems.length === 0 && g.flightRespawnCooldown <= 0) {
              g.flightItems.push({
                id: g.nextId++,
                x: W + 40,
                y: GROUND - 8,
                w: 34,
                h: 34,
              });
              setHint("날기 아이템을 잡아 변신하세요!");
            }
            for (const item of g.flightItems) item.x -= g.speed * 0.72;
            const missedFlightItem = g.flightItems.some((item) => item.x + item.w < -20);
            g.flightItems = g.flightItems.filter((item) => item.x + item.w >= -20);
            if (missedFlightItem && g.flightItems.length === 0) g.flightRespawnCooldown = 80;
            for (const item of g.flightItems) {
              if (!overlaps(playerBox, item)) continue;
              g.flying = true;
              g.vy = -6;
              g.transformFlash = 150;
              g.flightItems = [];
              g.ladders = [];
              g.ladderMode = "none";
              g.activeLadderId = 0;
              setFlying(true);
              setHint("변신 완료! 화면을 탭해서 위로 날기!");
              break;
            }
          }

          if (g.flying) {
            if (g.craneCooldown <= 0 && g.cranes.length === 0 && Math.random() < 0.0022) {
              g.cranes.push({
                id: g.nextId++,
                x: W + 80,
                y: 54,
                w: 170,
                h: 210,
              });
            }
            for (const crane of g.cranes) crane.x -= g.speed * 0.62;
            g.cranes = g.cranes.filter((crane) => crane.x + crane.w > -80);
            const crane = g.cranes.find((item) => item.x < 390 && item.x > 250);
            if (crane) enterCrane(crane);
          }

          for (const projectile of g.projectiles) projectile.x += projectile.vx;
          g.projectiles = g.projectiles.filter((projectile) => projectile.x < W + 80);
          const hitResult = resolveProjectileHits(g.enemies, g.projectiles);
          g.enemies = hitResult.enemies;
          g.projectiles = hitResult.projectiles;
          g.score += hitResult.scoreDelta;

          for (const enemy of g.enemies) {
            if (!overlaps(playerBox, enemy)) continue;
            const contact = resolveEnemyContact(combatState());
            g.armor = contact.state.armor;
            setArmor(g.armor);
            if (contact.survives && contact.consumeEnemy) {
              g.enemies = g.enemies.filter((item) => item.id !== enemy.id);
            } else {
              gameOver();
            }
            break;
          }

          g.score += g.speed / 12;
          setScore(Math.min(GOAL, Math.floor(g.score)));

          const nextLevel = levelOf(g.score);
          if (nextLevel !== g.level) g.level = nextLevel;

          const nextStage = stageForScore(g.score);
          const nextStageId = nextStage.id === "clear" ? 5 : nextStage.id;
          if (nextStageId !== g.stageId) {
            g.stageId = nextStageId;
            setStageFlash(`${nextStageId}단계 · ${nextStage.name}`);
            window.setTimeout(() => setStageFlash(""), 1400);
          }

          if (g.score >= GOAL) {
            g.score = GOAL;
            g.running = false;
            setScore(GOAL);
            setState("clear");
            setHint("완주 성공! 화면을 탭해서 다시 도전");
            saveBest(GOAL);
          }
        }
      }

      const palette = ((g.level - 1) % 4) + 1;
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, tok(`--game-sky${palette}-top`, "#101a2e"));
      sky.addColorStop(1, tok(`--game-sky${palette}-bottom`, "#233657"));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = tok("--game-orb", "#ffe6a7");
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(760, 72, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = tok("--game-cloud", "#f4f7ff");
      for (const cloud of g.clouds) {
        ctx.globalAlpha = 0.72;
        const radius = 20 * cloud.s;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, radius, 0, Math.PI * 2);
        ctx.arc(cloud.x + radius * 0.9, cloud.y + radius * 0.15, radius * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - radius * 0.9, cloud.y + radius * 0.2, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = tok("--game-bird", "#e8eefc");
      ctx.lineWidth = 2.2;
      for (const bird of g.birds) {
        const flap = Math.sin(bird.f) * 5;
        ctx.beginPath();
        ctx.moveTo(bird.x - 10, bird.y);
        ctx.quadraticCurveTo(bird.x - 5, bird.y - 5 - flap, bird.x, bird.y);
        ctx.quadraticCurveTo(bird.x + 5, bird.y - 5 - flap, bird.x + 10, bird.y);
        ctx.stroke();
      }

      ctx.fillStyle = tok("--game-hill", "#1b2b47");
      for (let i = 0; i < 6; i++) {
        const x = ((i * 220 - ((g.t * 1.2) % 1320) + 1320) % 1320) - 200;
        ctx.beginPath();
        ctx.arc(x, GROUND + 40, 130, Math.PI, 0);
        ctx.fill();
      }

      ctx.fillStyle = tok("--game-ground", "#0d1524");
      ctx.fillRect(0, GROUND + 46, W, H - GROUND);
      ctx.strokeStyle = tok("--game-line", "#3f5c8a");
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 46);
      ctx.lineTo(W, GROUND + 46);
      ctx.stroke();

      for (const obstacle of g.obstacles) {
        const base = GROUND + 46;
        const width = Math.max(obstacle.w, 22);
        const center = obstacle.x + width / 2;
        ctx.fillStyle = "#c2410c";
        ctx.fillRect(obstacle.x - 4, base - 6, width + 8, 6);
        ctx.fillStyle = "#fb923c";
        ctx.beginPath();
        ctx.moveTo(center, base - obstacle.h);
        ctx.lineTo(obstacle.x + width, base - 6);
        ctx.lineTo(obstacle.x, base - 6);
        ctx.closePath();
        ctx.fill();
      }

      for (const spring of g.springs) {
        const base = GROUND + 46;
        const squash = spring.c > 0 ? 0.45 : 1;
        const height = 34 * squash;
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(spring.x - 20, base - 6, 40, 6);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i <= 36; i++) {
          const ratio = i / 36;
          const springY = base - 6 - ratio * height;
          const springX = spring.x + Math.sin(ratio * 8 * Math.PI) * 15;
          if (i === 0) ctx.moveTo(springX, springY);
          else ctx.lineTo(springX, springY);
        }
        ctx.stroke();
      }

      for (const rainCloud of g.rainClouds) {
        ctx.fillStyle = "#64748b";
        const center = rainCloud.x + rainCloud.w / 2;
        ctx.beginPath();
        ctx.arc(center - 32, rainCloud.y + 12, 21, 0, Math.PI * 2);
        ctx.arc(center, rainCloud.y + 2, 27, 0, Math.PI * 2);
        ctx.arc(center + 32, rainCloud.y + 12, 21, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const rainX = rainCloud.x + 16 + i * 15;
          const offset = (g.t * 5 + i * 29) % 120;
          ctx.beginPath();
          ctx.moveTo(rainX, rainCloud.y + 30 + offset);
          ctx.lineTo(rainX - 3, rainCloud.y + 42 + offset);
          ctx.stroke();
        }
      }

      const drawUmbrella = (x: number, y: number, scale: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#fb7185";
        ctx.beginPath();
        ctx.arc(0, 0, 20, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#be185d";
        ctx.fillRect(-2, 0, 4, 22);
        ctx.restore();
      };
      for (const umbrella of g.umbrellas) drawUmbrella(umbrella.x, umbrella.y, 0.9);

      for (const mushroom of g.mushrooms) {
        ctx.fillStyle = "#f7e7ce";
        ctx.fillRect(mushroom.x + 10, mushroom.y + 14, 8, 16);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(mushroom.x + 14, mushroom.y + 14, 14, Math.PI, 0);
        ctx.fill();
      }

      for (const box of g.mysteryBoxes) {
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", box.x + box.w / 2, box.y + 28);
        ctx.textAlign = "start";
      }

      for (const ladder of g.ladders) {
        const top = LADDER_TOP_Y + 42;
        const bottom = GROUND + 46;
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(ladder.x + 10, top);
        ctx.lineTo(ladder.x + 10, bottom);
        ctx.moveTo(ladder.x + 44, top);
        ctx.lineTo(ladder.x + 44, bottom);
        ctx.stroke();
        ctx.lineWidth = 4;
        for (let y = top + 12; y < bottom; y += 22) {
          ctx.beginPath();
          ctx.moveTo(ladder.x + 10, y);
          ctx.lineTo(ladder.x + 44, y);
          ctx.stroke();
        }
        ctx.fillStyle = "#facc15";
        ctx.font = "22px sans-serif";
        ctx.fillText("● ● ●", ladder.x - 2, LADDER_TOP_Y + 18);
      }

      for (const item of g.flightItems) {
        const bob = Math.sin(g.t * 0.12) * 5;
        ctx.save();
        ctx.translate(item.x + 17, item.y + 17 + bob);
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? 17 : 7;
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-22, 3);
        ctx.quadraticCurveTo(-35, -8, -31, 12);
        ctx.moveTo(22, 3);
        ctx.quadraticCurveTo(35, -8, 31, 12);
        ctx.stroke();
        ctx.restore();
      }

      for (const crane of g.cranes) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(crane.x + 25, crane.y);
        ctx.lineTo(crane.x + 25, crane.y + crane.h);
        ctx.lineTo(crane.x + crane.w, crane.y + crane.h);
        ctx.moveTo(crane.x + 25, crane.y + 20);
        ctx.lineTo(crane.x + crane.w - 20, crane.y + 20);
        ctx.stroke();
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(crane.x + crane.w - 45, crane.y + 18, 35, 28);
      }

      for (const enemy of g.enemies) {
        if (enemy.kind === "ground") {
          ctx.fillStyle = "#7c3aed";
          ctx.beginPath();
          ctx.roundRect(enemy.x, enemy.y, enemy.w, enemy.h, 8);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(enemy.x + 7, enemy.y + 9, 5, 5);
          ctx.fillRect(enemy.x + 22, enemy.y + 9, 5, 5);
        } else {
          ctx.fillStyle = "#0ea5e9";
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const projectile of g.projectiles) {
        if (projectile.weapon === "gun") {
          ctx.fillStyle = "#fde047";
          ctx.fillRect(projectile.x, projectile.y, projectile.w, projectile.h);
        } else if (projectile.weapon === "bow") {
          ctx.strokeStyle = "#f8fafc";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(projectile.x, projectile.y + 3);
          ctx.lineTo(projectile.x + projectile.w, projectile.y + 3);
          ctx.stroke();
        } else {
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(projectile.x + 10, projectile.y + 7, 10, 0.2, Math.PI * 1.35);
          ctx.stroke();
        }
      }

      const y = g.y;
      const img = heroImg.current;
      const scale = g.giantTimer > 0 ? 1.5 : 1;
      if (g.flying || g.transformFlash > 0) {
        ctx.save();
        const pulse = 1 + Math.sin(g.t * 0.15) * 0.1;
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.ellipse(139, y + 24, 42 * pulse, 48 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(116, y + 25);
        ctx.quadraticCurveTo(92, y + 6, 98, y + 42);
        ctx.moveTo(162, y + 25);
        ctx.quadraticCurveTo(186, y + 6, 180, y + 42);
        ctx.stroke();
        ctx.restore();
      } else if (g.disguised) {
        ctx.fillStyle = "#a855f7";
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.ellipse(139, y + 26, 34, 47, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (img && img.complete && img.naturalWidth) {
        const playerHeight = 76 * scale;
        const playerWidth = (img.naturalWidth / img.naturalHeight) * playerHeight;
        ctx.drawImage(img, 139 - playerWidth / 2, y + 46 - playerHeight, playerWidth, playerHeight);
      } else {
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(120, y, 38 * scale, 46 * scale);
      }

      if (g.umbrella > 0 && !g.flying) drawUmbrella(139, y - 34, 1.1);

      if (g.craneActive) {
        ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
        ctx.fillRect(180, 25, 540, 280);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 7;
        ctx.strokeRect(210, 45, 480, 235);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(g.clawX, 48);
        ctx.lineTo(g.clawX, g.clawY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(g.clawX - 16, g.clawY);
        ctx.lineTo(g.clawX, g.clawY + 18);
        ctx.lineTo(g.clawX + 16, g.clawY);
        ctx.stroke();
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(g.cranePrizeX, 235, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("특별 아이템", g.cranePrizeX, 270);
        ctx.textAlign = "start";
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [combatState, syncInventory]);

  const stage = stageForScore(score);
  const stageLabel = stage.id === "clear" ? "완주" : `${stage.id}단계 · ${stage.name}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          박현준 러너
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          조작은 하나뿐! 게임 화면을 탭하세요
        </p>
      </header>

      <div className="flex w-full max-w-[900px] flex-wrap items-center justify-between gap-2 text-sm font-semibold text-foreground">
        <span>
          점수 {score} / {GOAL}
        </span>
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
          {stageLabel}
        </span>
        <span className="text-muted-foreground">최고 {best}</span>
      </div>

      <div className="flex w-full max-w-[900px] flex-wrap items-center justify-center gap-2 text-sm font-semibold text-foreground">
        <span className="rounded-full bg-muted px-3 py-1">💰 돈 {money}</span>
        <span className="rounded-full bg-muted px-3 py-1">방탄 {armor}</span>
        <span className="rounded-full bg-muted px-3 py-1">총 {bullets}</span>
        <span className="rounded-full bg-muted px-3 py-1">활 {arrows}</span>
        <span className="rounded-full bg-muted px-3 py-1">바나나 {bananas}</span>
        {disguised && !flying && (
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
            변장 ON · 무적
          </span>
        )}
        {flying && (
          <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
            날기 변신 · 완전 무적
          </span>
        )}
        {giant && (
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">버섯 파워</span>
        )}
      </div>

      <div className="h-2 w-full max-w-[900px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${Math.min(100, (score / GOAL) * 100)}%` }}
        />
      </div>

      <div
        className="relative w-full max-w-[900px] cursor-pointer overflow-hidden rounded-xl border border-border shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onPointerDown={handleTap}
        role="button"
        tabIndex={0}
        aria-label="게임 화면 탭"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") handleTap();
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full touch-manipulation" />

        {stageFlash && state === "playing" && (
          <div className="pointer-events-none absolute inset-x-0 top-8 text-center">
            <span className="rounded-full bg-primary/90 px-5 py-2 text-lg font-bold text-primary-foreground shadow-lg">
              {stageFlash}
            </span>
          </div>
        )}

        {state !== "playing" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/55 text-center backdrop-blur-[2px]">
            <img
              src={heroAsset.url}
              alt="러너 캐릭터"
              className="h-24 w-auto drop-shadow-lg sm:h-32"
            />
            <p className="max-w-md px-4 text-lg font-bold text-background">
              {state === "ready"
                ? "화면을 탭하면 모험 시작! 200점마다 새로운 세계가 열려요."
                : state === "clear"
                  ? `🏆 완주 성공! 돈 ${money}개를 모았어요!`
                  : `게임 종료! 점수 ${score} · 화면을 탭해서 다시 도전`}
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-[900px] rounded-lg bg-muted px-4 py-3 text-center text-base font-bold text-foreground">
        {hint}
      </div>

      <p className="max-w-[900px] text-center text-xs text-muted-foreground">
        0~199 달리기 · 200~399 자동 전투 · 400~599 사다리와 돈 · 600~799 날기 변신과 크레인 ·
        800~999 챔피언 코스
      </p>
    </main>
  );
}
