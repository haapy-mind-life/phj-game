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
import type { Enemy, Mushroom, MysteryBox, Projectile, WeaponKind } from "@/game/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "박현준 러너 - 끝없이 달리는 점프 게임" },
      {
        name: "description",
        content:
          "박현준 러너는 장애물을 뛰어넘고 아이템과 무기를 활용해 1000점 완주에 도전하는 아케이드 러닝 게임입니다.",
      },
      { property: "og:title", content: "박현준 러너 - 끝없이 달리는 점프 게임" },
      {
        property: "og:description",
        content: "점프하고 아이템을 모으며 1000점 완주에 도전하는 러닝 게임.",
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
type Plat = { x: number; y: number; w: number };
type RainCloud = { x: number; y: number; w: number };
type Umbrella = { x: number; y: number; taken: boolean };

const W = 900;
const H = 340;
const GROUND = 280;
const GOAL = 1000;
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
  const [level, setLevel] = useState(1);
  const [levelFlash, setLevelFlash] = useState(0);
  const [armor, setArmor] = useState(1);
  const [bullets, setBullets] = useState(12);
  const [arrows, setArrows] = useState(6);
  const [bananas, setBananas] = useState(0);
  const [disguised, setDisguised] = useState(false);
  const [giant, setGiant] = useState(false);

  const game = useRef({
    y: GROUND,
    vy: 0,
    obstacles: [] as Obstacle[],
    clouds: [] as Cloud[],
    birds: [] as Bird[],
    springs: [] as Spring[],
    plats: [] as Plat[],
    rainClouds: [] as RainCloud[],
    umbrellas: [] as Umbrella[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    mushrooms: [] as Mushroom[],
    mysteryBoxes: [] as MysteryBox[],
    umbrella: 0,
    armor: 1,
    bullets: 12,
    arrows: 6,
    bananas: 0,
    disguised: false,
    giantTimer: 0,
    nextId: 1,
    onPlat: false,
    speed: 7,
    t: 0,
    score: 0,
    level: 1,
    running: false,
  });

  const start = useCallback(() => {
    const g = game.current;
    g.y = GROUND;
    g.vy = 0;
    g.obstacles = [];
    g.springs = [];
    g.plats = [];
    g.rainClouds = [];
    g.umbrellas = [];
    g.enemies = [];
    g.projectiles = [];
    g.mushrooms = [];
    g.mysteryBoxes = [];
    g.umbrella = 0;
    g.armor = 1;
    g.bullets = 12;
    g.arrows = 6;
    g.bananas = 0;
    g.disguised = false;
    g.giantTimer = 0;
    g.nextId = 1;
    g.onPlat = false;
    g.clouds = makeClouds();
    g.birds = makeBirds();
    g.speed = 7;
    g.t = 0;
    g.score = 0;
    g.level = 1;
    g.running = true;
    setScore(0);
    setLevel(1);
    setLevelFlash(0);
    setArmor(1);
    setBullets(12);
    setArrows(6);
    setBananas(0);
    setDisguised(false);
    setGiant(false);
    setState("playing");
  }, []);

  const jump = useCallback(() => {
    const g = game.current;
    if (!g.running) {
      start();
      return;
    }
    if (g.y >= GROUND) g.vy = -15.5;
  }, [start]);

  const shoot = useCallback((weapon: WeaponKind) => {
    const g = game.current;
    if (!g.running) return;
    const result = fireProjectile(
      {
        armor: g.armor,
        bullets: g.bullets,
        arrows: g.arrows,
        bananas: g.bananas,
        disguised: g.disguised,
        giantTimer: g.giantTimer,
      },
      weapon,
      158,
      g.y + 21,
    );
    g.bullets = result.state.bullets;
    g.arrows = result.state.arrows;
    g.bananas = result.state.bananas;
    if (result.projectile) {
      result.projectile.id = g.nextId++;
      g.projectiles.push(result.projectile);
    }
    setBullets(g.bullets);
    setArrows(g.arrows);
    setBananas(g.bananas);
  }, []);

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
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
      } else if (event.code === "KeyX") {
        event.preventDefault();
        shoot("gun");
      } else if (event.code === "KeyC") {
        event.preventDefault();
        shoot("bow");
      } else if (event.code === "KeyB") {
        event.preventDefault();
        shoot("banana");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, shoot]);

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
      g.running = false;
      setState("over");
      saveBest(Math.floor(g.score));
    };

    const combatState = () => {
      const g = game.current;
      return {
        armor: g.armor,
        bullets: g.bullets,
        arrows: g.arrows,
        bananas: g.bananas,
        disguised: g.disguised,
        giantTimer: g.giantTimer,
      };
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
        g.speed = 7 + g.t / 700 + (g.level - 1) * 0.7;
        const prevFeet = g.y + 46;
        g.vy += 0.78;
        g.y = Math.min(GROUND, g.y + g.vy);
        if (g.y < 6) {
          g.y = 6;
          if (g.vy < 0) g.vy = 0;
        }
        if (g.umbrella > 0) g.umbrella -= 1;
        if (g.giantTimer > 0) {
          g.giantTimer -= 1;
          if (g.giantTimer === 0) setGiant(false);
        }

        const px = 120;
        const pw = 38;
        const playerBox = { x: px, y: g.y, w: pw, h: 46 };

        const lastPlat = g.plats[g.plats.length - 1];
        if ((!lastPlat || lastPlat.x + lastPlat.w < W - 260) && Math.random() < 0.02) {
          g.plats.push({
            x: W + 60,
            y: 110 + Math.random() * 60,
            w: 130 + Math.random() * 110,
          });
        }
        g.plats.forEach((plat) => (plat.x -= g.speed));
        g.plats = g.plats.filter((plat) => plat.x + plat.w > -40);
        g.onPlat = false;
        const feet = g.y + 46;
        for (const plat of g.plats) {
          if (
            g.vy >= 0 &&
            px + pw > plat.x &&
            px < plat.x + plat.w &&
            prevFeet <= plat.y + 4 &&
            feet >= plat.y
          ) {
            g.y = plat.y - 46;
            g.vy = 0;
            g.onPlat = true;
          }
        }

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
          if (
            px + pw > obstacle.x &&
            px < obstacle.x + obstacle.w &&
            g.y > GROUND - obstacle.h + 6
          ) {
            if (g.disguised) {
              g.obstacles = g.obstacles.filter((item) => item !== obstacle);
            } else {
              gameOver();
            }
            break;
          }
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
        for (const spring of g.springs) {
          if (px + pw > spring.x - 22 && px < spring.x + 22 && g.vy >= 0 && g.y > GROUND - 34) {
            spring.c = 12;
            g.vy = -21;
            g.y = GROUND - 34;
          }
        }

        const lastRainCloud = g.rainClouds[g.rainClouds.length - 1];
        if ((!lastRainCloud || lastRainCloud.x < W - 420) && Math.random() < 0.008) {
          g.rainClouds.push({
            x: W + 80,
            y: 40 + Math.random() * 40,
            w: 120,
          });
        }
        g.rainClouds.forEach((cloud) => (cloud.x -= g.speed * 0.9));
        g.rainClouds = g.rainClouds.filter((cloud) => cloud.x + cloud.w > -60);

        const lastUmbrella = g.umbrellas[g.umbrellas.length - 1];
        if ((!lastUmbrella || lastUmbrella.x < W - 420) && Math.random() < 0.008) {
          g.umbrellas.push({
            x: W + 60,
            y: 120 + Math.random() * 90,
            taken: false,
          });
        }
        g.umbrellas.forEach((umbrella) => (umbrella.x -= g.speed));
        g.umbrellas = g.umbrellas.filter((umbrella) => umbrella.x > -60 && !umbrella.taken);
        for (const umbrella of g.umbrellas) {
          if (Math.hypot(px + pw / 2 - umbrella.x, g.y + 23 - umbrella.y) < 30) {
            umbrella.taken = true;
            g.umbrella = 600;
          }
        }

        for (const rainCloud of g.rainClouds) {
          const inX = px + pw > rainCloud.x && px < rainCloud.x + rainCloud.w;
          const inRain = g.y + 46 > rainCloud.y + 24 && g.y < rainCloud.y + 170;
          if (inX && inRain && g.umbrella <= 0 && !g.disguised) {
            gameOver();
            break;
          }
        }

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
        for (const enemy of g.enemies) {
          enemy.x -= g.speed * (enemy.kind === "air" ? 0.75 : 0.9);
        }
        g.enemies = g.enemies.filter((enemy) => enemy.x + enemy.w > -50);

        const lastMushroom = g.mushrooms[g.mushrooms.length - 1];
        if ((!lastMushroom || lastMushroom.x < W - 520) && Math.random() < 0.0025) {
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
        for (const box of g.mysteryBoxes) box.x -= g.speed * 0.85;
        g.mysteryBoxes = g.mysteryBoxes.filter((box) => box.x + box.w > -50 && !box.opened);
        for (const box of g.mysteryBoxes) {
          if (!overlaps(playerBox, box)) continue;
          box.opened = true;
          const next = openMysteryBox(combatState());
          g.bananas = next.bananas;
          g.disguised = next.disguised;
          setBananas(g.bananas);
          setDisguised(g.disguised);
          g.mysteryBoxes = g.mysteryBoxes.filter((item) => item.id !== box.id);
          break;
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
        setScore(Math.floor(g.score));

        const nextLevel = levelOf(g.score);
        if (nextLevel !== g.level) {
          g.level = nextLevel;
          setLevel(nextLevel);
          setLevelFlash(nextLevel);
          window.setTimeout(() => setLevelFlash(0), 1200);
        }

        if (g.score >= GOAL) {
          g.score = GOAL;
          g.running = false;
          setScore(GOAL);
          setState("clear");
          saveBest(GOAL);
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
        ctx.globalAlpha = 0.75;
        const radius = 20 * cloud.s;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, radius, 0, Math.PI * 2);
        ctx.arc(cloud.x + radius * 0.9, cloud.y + radius * 0.15, radius * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - radius * 0.9, cloud.y + radius * 0.2, radius * 0.7, 0, Math.PI * 2);
        ctx.arc(cloud.x + radius * 0.1, cloud.y - radius * 0.55, radius * 0.65, 0, Math.PI * 2);
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
        ctx.fillStyle = tok("--game-cone-dark", "#c2372f");
        ctx.fillRect(obstacle.x - 4, base - 6, width + 8, 6);
        ctx.fillStyle = tok("--game-cone", "#ff6b35");
        ctx.beginPath();
        ctx.moveTo(center, base - obstacle.h);
        ctx.lineTo(obstacle.x + width, base - 6);
        ctx.lineTo(obstacle.x, base - 6);
        ctx.closePath();
        ctx.fill();
      }

      for (const plat of g.plats) {
        ctx.fillStyle = tok("--game-plat", "#ffffff");
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        const radius = 16;
        ctx.arc(plat.x + radius, plat.y + radius, radius, Math.PI, Math.PI * 1.5);
        ctx.arc(plat.x + plat.w * 0.35, plat.y + 2, 20, Math.PI, 0);
        ctx.arc(plat.x + plat.w * 0.7, plat.y + 4, 16, Math.PI, 0);
        ctx.lineTo(plat.x + plat.w, plat.y + 22);
        ctx.lineTo(plat.x, plat.y + 22);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const rainCloud of g.rainClouds) {
        ctx.fillStyle = tok("--game-raincloud", "#5a6b86");
        const center = rainCloud.x + rainCloud.w / 2;
        ctx.beginPath();
        ctx.arc(center - 34, rainCloud.y + 12, 22, 0, Math.PI * 2);
        ctx.arc(center, rainCloud.y + 2, 28, 0, Math.PI * 2);
        ctx.arc(center + 34, rainCloud.y + 12, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = tok("--game-rain", "#9fd0ff");
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 8; i++) {
          const rainX = rainCloud.x + 12 + i * ((rainCloud.w - 24) / 7);
          const offset = (g.t * 6 + i * 37) % 150;
          ctx.beginPath();
          ctx.moveTo(rainX, rainCloud.y + 28 + offset);
          ctx.lineTo(rainX - 3, rainCloud.y + 40 + offset);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      const drawUmbrella = (x: number, y: number, scale: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = tok("--game-umbrella", "#ff5d8f");
        ctx.beginPath();
        ctx.arc(0, 0, 20, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = tok("--game-umbrella-dark", "#c9346b");
        ctx.fillRect(-2, 0, 4, 22);
        ctx.restore();
      };
      for (const umbrella of g.umbrellas) {
        const bob = Math.sin(g.t * 0.08 + umbrella.x * 0.02) * 4;
        drawUmbrella(umbrella.x, umbrella.y + bob, 0.9);
      }

      for (const spring of g.springs) {
        const base = GROUND + 46;
        const squash = spring.c > 0 ? 0.45 : 1;
        const height = 34 * squash;
        ctx.fillStyle = tok("--game-spring-base", "#ff4d6d");
        ctx.fillRect(spring.x - 20, base - 6, 40, 6);
        ctx.strokeStyle = tok("--game-spring", "#d8dee9");
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const ratio = i / 48;
          const springY = base - 6 - ratio * height;
          const springX = spring.x + Math.sin(ratio * 8 * Math.PI) * 15;
          if (i === 0) ctx.moveTo(springX, springY);
          else ctx.lineTo(springX, springY);
        }
        ctx.stroke();
      }

      for (const mushroom of g.mushrooms) {
        ctx.fillStyle = "#f7e7ce";
        ctx.fillRect(mushroom.x + 10, mushroom.y + 14, 8, 16);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(mushroom.x + 14, mushroom.y + 14, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(mushroom.x + 8, mushroom.y + 8, 3, 0, Math.PI * 2);
        ctx.arc(mushroom.x + 19, mushroom.y + 10, 3, 0, Math.PI * 2);
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
          ctx.strokeStyle = "#bae6fd";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(enemy.x + 5, enemy.y + 14);
          ctx.lineTo(enemy.x - 8, enemy.y + 5);
          ctx.moveTo(enemy.x + enemy.w - 5, enemy.y + 14);
          ctx.lineTo(enemy.x + enemy.w + 8, enemy.y + 5);
          ctx.stroke();
        }
      }

      for (const projectile of g.projectiles) {
        if (projectile.weapon === "gun") {
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.roundRect(projectile.x, projectile.y, projectile.w, projectile.h, 3);
          ctx.fill();
        } else if (projectile.weapon === "bow") {
          ctx.strokeStyle = "#f8fafc";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(projectile.x, projectile.y + 3);
          ctx.lineTo(projectile.x + projectile.w - 5, projectile.y + 3);
          ctx.stroke();
          ctx.fillStyle = "#fb923c";
          ctx.beginPath();
          ctx.moveTo(projectile.x + projectile.w, projectile.y + 3);
          ctx.lineTo(projectile.x + projectile.w - 7, projectile.y - 2);
          ctx.lineTo(projectile.x + projectile.w - 7, projectile.y + 8);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(projectile.x + 10, projectile.y + 7);
          ctx.rotate((g.t + projectile.id * 7) * 0.16);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0.2, Math.PI * 1.35);
          ctx.stroke();
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(7, -6);
          ctx.lineTo(11, -10);
          ctx.stroke();
          ctx.restore();
        }
      }

      const y = g.y;
      const img = heroImg.current;
      const scale = g.giantTimer > 0 ? 1.5 : 1;
      if (g.disguised) {
        ctx.save();
        const pulse = 1 + Math.sin(g.t * 0.12) * 0.08;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.ellipse(139, y + 26, 34 * pulse, 47 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(112, y + 12);
        ctx.lineTo(166, y + 12);
        ctx.lineTo(158, y + 48);
        ctx.lineTo(120, y + 48);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (img && img.complete && img.naturalWidth) {
        const playerHeight = 76 * scale;
        const playerWidth = (img.naturalWidth / img.naturalHeight) * playerHeight;
        ctx.drawImage(img, 139 - playerWidth / 2, y + 46 - playerHeight, playerWidth, playerHeight);
      } else {
        ctx.fillStyle = tok("--game-player", "#ffd166");
        ctx.fillRect(120 - (38 * (scale - 1)) / 2, y + 46 - 46 * scale, 38 * scale, 46 * scale);
      }

      if (g.disguised) {
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.ellipse(139, y + 23, 35, 48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (g.armor > 0) {
        ctx.strokeStyle = "#67e8f9";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(139, y + 23, 30, 42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (g.umbrella > 0) {
        const blink = g.umbrella > 90 || g.t % 20 < 12;
        if (blink) drawUmbrella(139, y - 34, 1.1);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          박현준 러너
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Space/↑ 점프 · X 총 · C 활 · B 바나나 · 화면 버튼 지원
        </p>
      </header>

      <div className="flex w-full max-w-[900px] items-center justify-between text-sm font-semibold text-foreground">
        <span>
          점수 {score} / {GOAL}
        </span>
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">{level}단계</span>
        <span className="text-muted-foreground">최고 {best}</span>
      </div>

      <div className="flex w-full max-w-[900px] flex-wrap items-center justify-center gap-2 text-sm font-semibold text-foreground">
        <span className="rounded-full bg-muted px-3 py-1">방탄 {armor}</span>
        <span className="rounded-full bg-muted px-3 py-1">총알 {bullets}</span>
        <span className="rounded-full bg-muted px-3 py-1">화살 {arrows}</span>
        <span className="rounded-full bg-muted px-3 py-1">바나나 {bananas}</span>
        {disguised && (
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
            변장 ON · 무적
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
        className="relative w-full max-w-[900px] overflow-hidden rounded-xl border border-border shadow-lg"
        onPointerDown={jump}
        role="button"
        tabIndex={0}
        aria-label="점프"
        onKeyDown={() => {}}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />

        {levelFlash > 0 && state === "playing" && (
          <div className="pointer-events-none absolute inset-x-0 top-10 text-center">
            <span className="rounded-full bg-primary/90 px-5 py-2 text-lg font-bold text-primary-foreground shadow-lg">
              {levelFlash}단계 시작!
            </span>
          </div>
        )}

        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/50 text-center backdrop-blur-[2px]">
            <img
              src={heroAsset.url}
              alt="박현준 선수"
              className="h-24 w-auto drop-shadow-lg sm:h-32"
            />
            <p className="text-lg font-bold text-background">
              {state === "ready"
                ? "달릴 준비 되셨나요? ?상자에서 영구 변장옷과 바나나를 찾아보세요"
                : state === "clear"
                  ? "🏆 완주 성공! 1000점 달성"
                  : `게임 종료! 점수 ${score} · ${level}단계`}
            </p>
            <button
              onClick={(event) => {
                event.stopPropagation();
                start();
              }}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {state === "ready" ? "게임 시작" : state === "clear" ? "다시 도전" : "다시 하기"}
            </button>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-[900px] grid-cols-4 gap-2 sm:gap-3">
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            jump();
          }}
          className="rounded-lg bg-primary px-2 py-3 font-bold text-primary-foreground sm:px-4"
        >
          점프
        </button>
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            shoot("gun");
          }}
          className="rounded-lg bg-accent px-2 py-3 font-bold text-accent-foreground sm:px-4"
        >
          총 · {bullets}
        </button>
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            shoot("bow");
          }}
          className="rounded-lg bg-secondary px-2 py-3 font-bold text-secondary-foreground sm:px-4"
        >
          활 · {arrows}
        </button>
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            shoot("banana");
          }}
          className="rounded-lg bg-muted px-2 py-3 font-bold text-foreground sm:px-4"
        >
          바나나 · {bananas}
        </button>
      </div>
    </main>
  );
}
