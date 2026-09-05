import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import heroAsset from "@/assets/runner-hero.png.asset.json";
import {
  activateMushroom,
  fireProjectile,
  resolveEnemyContact,
  resolveProjectileHits,
} from "@/game/combat";
import type { Enemy, Mushroom, Projectile, WeaponKind } from "@/game/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "박현준 러너 - 끝없이 달리는 점프 게임" },
      {
        name: "description",
        content:
          "박현준 러너는 장애물을 뛰어넘고 적을 물리치며 최고 기록에 도전하는 아케이드 러닝 게임입니다.",
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
const levelOf = (s: number) => Math.min(10, Math.floor(s / 100) + 1);

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
    umbrella: 0,
    armor: 1,
    bullets: 12,
    arrows: 6,
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
    g.umbrella = 0;
    g.armor = 1;
    g.bullets = 12;
    g.arrows = 6;
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
        giantTimer: g.giantTimer,
      },
      weapon,
      158,
      g.y + 21,
    );
    g.bullets = result.state.bullets;
    g.arrows = result.state.arrows;
    if (result.projectile) {
      result.projectile.id = g.nextId++;
      g.projectiles.push(result.projectile);
    }
    setBullets(g.bullets);
    setArrows(g.arrows);
  }, []);

  useEffect(() => {
    try {
      const b = Number(localStorage.getItem("runner-best") || 0);
      if (b) setBest(b);
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
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      } else if (e.code === "KeyX") {
        e.preventDefault();
        shoot("gun");
      } else if (e.code === "KeyC") {
        e.preventDefault();
        shoot("bow");
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
    const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;

    const saveBest = (s: number) =>
      setBest((b) => {
        const nb = Math.max(b, s);
        try {
          localStorage.setItem("runner-best", String(nb));
        } catch {
          /* ignore */
        }
        return nb;
      });

    const gameOver = () => {
      const g = game.current;
      g.running = false;
      setState("over");
      saveBest(Math.floor(g.score));
    };

    const loop = () => {
      const g = game.current;
      if (g.clouds.length === 0) g.clouds = makeClouds();
      if (g.birds.length === 0) g.birds = makeBirds();

      for (const c of g.clouds) {
        c.x -= c.sp;
        if (c.x < -160) {
          c.x = W + 60;
          c.y = 30 + Math.random() * 90;
        }
      }
      for (const b of g.birds) {
        b.x -= b.sp;
        b.f += 0.16;
        if (b.x < -60) {
          b.x = W + 60 + Math.random() * 300;
          b.y = 40 + Math.random() * 90;
        }
      }

      if (g.running) {
        g.t += 1;
        const lv = g.level;
        g.speed = 7 + g.t / 700 + (lv - 1) * 0.7;
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
          g.plats.push({ x: W + 60, y: 110 + Math.random() * 60, w: 130 + Math.random() * 110 });
        }
        g.plats.forEach((p) => (p.x -= g.speed));
        g.plats = g.plats.filter((p) => p.x + p.w > -40);

        g.onPlat = false;
        const feet = g.y + 46;
        for (const p of g.plats) {
          if (g.vy >= 0 && px + pw > p.x && px < p.x + p.w && prevFeet <= p.y + 4 && feet >= p.y) {
            g.y = p.y - 46;
            g.vy = 0;
            g.onPlat = true;
          }
        }

        for (const o of g.obstacles) {
          if (px + pw > o.x && px < o.x + o.w && g.y > GROUND - o.h + 6) {
            gameOver();
            break;
          }
        }

        const lastSpring = g.springs[g.springs.length - 1];
        if ((!lastSpring || lastSpring.x < W - 380) && Math.random() < 0.01) {
          g.springs.push({ x: W + 60, c: 0 });
        }
        g.springs.forEach((s) => {
          s.x -= g.speed;
          if (s.c > 0) s.c -= 1;
        });
        g.springs = g.springs.filter((s) => s.x > -60);
        for (const s of g.springs) {
          if (px + pw > s.x - 22 && px < s.x + 22 && g.vy >= 0 && g.y > GROUND - 34) {
            s.c = 12;
            g.vy = -21;
            g.y = GROUND - 34;
          }
        }

        const lastRc = g.rainClouds[g.rainClouds.length - 1];
        if ((!lastRc || lastRc.x < W - 420) && Math.random() < 0.008) {
          g.rainClouds.push({ x: W + 80, y: 40 + Math.random() * 40, w: 120 });
        }
        g.rainClouds.forEach((r) => (r.x -= g.speed * 0.9));
        g.rainClouds = g.rainClouds.filter((r) => r.x + r.w > -60);

        const lastUm = g.umbrellas[g.umbrellas.length - 1];
        if ((!lastUm || lastUm.x < W - 420) && Math.random() < 0.008) {
          g.umbrellas.push({ x: W + 60, y: 120 + Math.random() * 90, taken: false });
        }
        g.umbrellas.forEach((u) => (u.x -= g.speed));
        g.umbrellas = g.umbrellas.filter((u) => u.x > -60 && !u.taken);
        for (const u of g.umbrellas) {
          if (Math.hypot(px + pw / 2 - u.x, g.y + 23 - u.y) < 30) {
            u.taken = true;
            g.umbrella = 600;
          }
        }

        for (const r of g.rainClouds) {
          const inX = px + pw > r.x && px < r.x + r.w;
          const inRain = g.y + 46 > r.y + 24 && g.y < r.y + 170;
          if (inX && inRain && g.umbrella <= 0) {
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
            y: air ? 120 + Math.random() * 70 : GROUND + 46 - 38,
            w: air ? 38 : 34,
            h: air ? 30 : 38,
            alive: true,
          });
        }
        for (const enemy of g.enemies) enemy.x -= g.speed * (enemy.kind === "air" ? 0.75 : 0.9);
        g.enemies = g.enemies.filter((enemy) => enemy.x + enemy.w > -50);

        const lastMushroom = g.mushrooms[g.mushrooms.length - 1];
        if ((!lastMushroom || lastMushroom.x < W - 520) && Math.random() < 0.0025) {
          g.mushrooms.push({ id: g.nextId++, x: W + 50, y: GROUND + 46 - 30, w: 28, h: 30 });
        }
        for (const mushroom of g.mushrooms) mushroom.x -= g.speed * 0.9;
        g.mushrooms = g.mushrooms.filter((mushroom) => mushroom.x + mushroom.w > -40);
        for (const mushroom of g.mushrooms) {
          if (!overlaps(playerBox, mushroom)) continue;
          const next = activateMushroom({
            armor: g.armor,
            bullets: g.bullets,
            arrows: g.arrows,
            giantTimer: g.giantTimer,
          });
          g.giantTimer = next.giantTimer;
          setGiant(true);
          g.mushrooms = g.mushrooms.filter((item) => item.id !== mushroom.id);
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
          const contact = resolveEnemyContact({
            armor: g.armor,
            bullets: g.bullets,
            arrows: g.arrows,
            giantTimer: g.giantTimer,
          });
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

        const nl = levelOf(g.score);
        if (nl !== g.level) {
          g.level = nl;
          setLevel(nl);
          setLevelFlash(nl);
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

      const pal = ((g.level - 1) % 4) + 1;
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, tok(`--game-sky${pal}-top`, "#101a2e"));
      sky.addColorStop(1, tok(`--game-sky${pal}-bottom`, "#233657"));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = tok("--game-orb", "#ffe6a7");
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(760, 72, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = tok("--game-cloud", "#f4f7ff");
      for (const c of g.clouds) {
        ctx.globalAlpha = 0.75;
        const r = 20 * c.s;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.arc(c.x + r * 0.9, c.y + r * 0.15, r * 0.8, 0, Math.PI * 2);
        ctx.arc(c.x - r * 0.9, c.y + r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.arc(c.x + r * 0.1, c.y - r * 0.55, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = tok("--game-bird", "#e8eefc");
      ctx.lineWidth = 2.2;
      for (const b of g.birds) {
        const flap = Math.sin(b.f) * 5;
        ctx.beginPath();
        ctx.moveTo(b.x - 10, b.y);
        ctx.quadraticCurveTo(b.x - 5, b.y - 5 - flap, b.x, b.y);
        ctx.quadraticCurveTo(b.x + 5, b.y - 5 - flap, b.x + 10, b.y);
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

      for (const o of g.obstacles) {
        const base = GROUND + 46;
        const cw = Math.max(o.w, 22);
        const cx = o.x + cw / 2;
        ctx.fillStyle = tok("--game-cone-dark", "#c2372f");
        ctx.fillRect(o.x - 4, base - 6, cw + 8, 6);
        ctx.fillStyle = tok("--game-cone", "#ff6b35");
        ctx.beginPath();
        ctx.moveTo(cx, base - o.h);
        ctx.lineTo(o.x + cw, base - 6);
        ctx.lineTo(o.x, base - 6);
        ctx.closePath();
        ctx.fill();
      }

      for (const p of g.plats) {
        ctx.fillStyle = tok("--game-plat", "#ffffff");
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        const r = 16;
        ctx.arc(p.x + r, p.y + r, r, Math.PI, Math.PI * 1.5);
        ctx.arc(p.x + p.w * 0.35, p.y + 2, 20, Math.PI, 0);
        ctx.arc(p.x + p.w * 0.7, p.y + 4, 16, Math.PI, 0);
        ctx.lineTo(p.x + p.w, p.y + 22);
        ctx.lineTo(p.x, p.y + 22);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const rc of g.rainClouds) {
        ctx.fillStyle = tok("--game-raincloud", "#5a6b86");
        const cx = rc.x + rc.w / 2;
        ctx.beginPath();
        ctx.arc(cx - 34, rc.y + 12, 22, 0, Math.PI * 2);
        ctx.arc(cx, rc.y + 2, 28, 0, Math.PI * 2);
        ctx.arc(cx + 34, rc.y + 12, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = tok("--game-rain", "#9fd0ff");
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 8; i++) {
          const rx = rc.x + 12 + i * ((rc.w - 24) / 7);
          const off = (g.t * 6 + i * 37) % 150;
          ctx.beginPath();
          ctx.moveTo(rx, rc.y + 28 + off);
          ctx.lineTo(rx - 3, rc.y + 40 + off);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      const drawUmbrella = (ux: number, uy: number, sc: number) => {
        ctx.save();
        ctx.translate(ux, uy);
        ctx.scale(sc, sc);
        ctx.fillStyle = tok("--game-umbrella", "#ff5d8f");
        ctx.beginPath();
        ctx.arc(0, 0, 20, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = tok("--game-umbrella-dark", "#c9346b");
        ctx.fillRect(-2, 0, 4, 22);
        ctx.restore();
      };
      for (const u of g.umbrellas) {
        const bob = Math.sin(g.t * 0.08 + u.x * 0.02) * 4;
        drawUmbrella(u.x, u.y + bob, 0.9);
      }

      for (const s of g.springs) {
        const base = GROUND + 46;
        const squash = s.c > 0 ? 0.45 : 1;
        const hgt = 34 * squash;
        ctx.fillStyle = tok("--game-spring-base", "#ff4d6d");
        ctx.fillRect(s.x - 20, base - 6, 40, 6);
        ctx.strokeStyle = tok("--game-spring", "#d8dee9");
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const tt = i / 48;
          const yy = base - 6 - tt * hgt;
          const xx = s.x + Math.sin(tt * 8 * Math.PI) * 15;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
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
        } else {
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
        }
      }

      const y = g.y;
      const img = heroImg.current;
      const scale = g.giantTimer > 0 ? 1.5 : 1;
      if (img && img.complete && img.naturalWidth) {
        const ph2 = 76 * scale;
        const pw2 = (img.naturalWidth / img.naturalHeight) * ph2;
        ctx.drawImage(img, 139 - pw2 / 2, y + 46 - ph2, pw2, ph2);
      } else {
        ctx.fillStyle = tok("--game-player", "#ffd166");
        ctx.fillRect(120 - (38 * (scale - 1)) / 2, y + 46 - 46 * scale, 38 * scale, 46 * scale);
      }

      if (g.armor > 0) {
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
          Space/↑ 점프 · X 총 · C 활 · 화면 버튼 지원
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
                ? "달릴 준비 되셨나요? 방탄·총·활을 들고 1000점에 도전하세요"
                : state === "clear"
                  ? "🏆 완주 성공! 1000점 달성"
                  : `게임 종료! 점수 ${score} · ${level}단계`}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {state === "ready" ? "게임 시작" : state === "clear" ? "다시 도전" : "다시 하기"}
            </button>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-[900px] grid-cols-3 gap-3">
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            jump();
          }}
          className="rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground"
        >
          점프
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            shoot("gun");
          }}
          className="rounded-lg bg-accent px-4 py-3 font-bold text-accent-foreground"
        >
          총 · {bullets}
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            shoot("bow");
          }}
          className="rounded-lg bg-secondary px-4 py-3 font-bold text-secondary-foreground"
        >
          활 · {arrows}
        </button>
      </div>
    </main>
  );
}
