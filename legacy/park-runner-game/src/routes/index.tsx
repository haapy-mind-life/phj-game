import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import heroAsset from "@/assets/runner-hero.png.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "박현준 러너 - 끝없이 달리는 점프 게임" },
      {
        name: "description",
        content:
          "박현준 러너는 장애물을 뛰어넘으며 최고 기록에 도전하는 간단한 러닝 게임입니다. 스페이스바나 화면 터치로 바로 시작하세요.",
      },
      { property: "og:title", content: "박현준 러너 - 끝없이 달리는 점프 게임" },
      {
        property: "og:description",
        content: "장애물을 뛰어넘고 최고 기록에 도전하는 러닝 게임.",
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

function Index() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroImg = useRef<HTMLImageElement | null>(null);
  const [state, setState] = useState<"ready" | "playing" | "over" | "clear">(
    "ready",
  );


  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelFlash, setLevelFlash] = useState(0);

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
    umbrella: 0,
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
    g.rings = [];
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

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

    const loop = () => {
      const g = game.current;
      if (g.clouds.length === 0) g.clouds = makeClouds();
      if (g.birds.length === 0) g.birds = makeBirds();

      // ambient life keeps moving even on menus
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

        const px = 120;
        const pw = 38;

        // sky cloud paths you can land on
        const lastPlat = g.plats[g.plats.length - 1];
        if ((!lastPlat || lastPlat.x + lastPlat.w < W - 260) && Math.random() < 0.02) {
          g.plats.push({
            x: W + 60,
            y: 110 + Math.random() * 60,
            w: 130 + Math.random() * 110,
          });
        }
        g.plats.forEach((p) => (p.x -= g.speed));
        g.plats = g.plats.filter((p) => p.x + p.w > -40);

        g.onPlat = false;
        const feet = g.y + 46;
        for (const p of g.plats) {
          if (
            g.vy >= 0 &&
            px + pw > p.x &&
            px < p.x + p.w &&
            prevFeet <= p.y + 4 &&
            feet >= p.y
          ) {
            g.y = p.y - 46;
            g.vy = 0;
            g.onPlat = true;
          }
        }


        for (const o of g.obstacles) {
          if (px + pw > o.x && px < o.x + o.w && g.y > GROUND - o.h + 6) {
            g.running = false;
            setState("over");
            saveBest(Math.floor(g.score));
          }
        }

        // springs on the ground: step on one to launch sky high
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
          if (
            px + pw > s.x - 22 &&
            px < s.x + 22 &&
            g.vy >= 0 &&
            g.y > GROUND - 34
          ) {
            s.c = 12;
            g.vy = -21;
            g.y = GROUND - 34;
          }
        }

        // rain clouds up in the sky: you need an umbrella to pass
        const lastRc = g.rainClouds[g.rainClouds.length - 1];
        if ((!lastRc || lastRc.x < W - 420) && Math.random() < 0.008) {
          g.rainClouds.push({ x: W + 80, y: 40 + Math.random() * 40, w: 120 });
        }
        g.rainClouds.forEach((r) => (r.x -= g.speed * 0.9));
        g.rainClouds = g.rainClouds.filter((r) => r.x + r.w > -60);

        // umbrella pickups float in the air
        const lastUm = g.umbrellas[g.umbrellas.length - 1];
        if ((!lastUm || lastUm.x < W - 420) && Math.random() < 0.008) {
          g.umbrellas.push({
            x: W + 60,
            y: 120 + Math.random() * 90,
            taken: false,
          });
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
            g.running = false;
            setState("over");
            saveBest(Math.floor(g.score));
          }
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


      // draw
      const pal = ((game.current.level - 1) % 4) + 1;
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, tok(`--game-sky${pal}-top`, "#101a2e"));
      sky.addColorStop(1, tok(`--game-sky${pal}-bottom`, "#233657"));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // sun / moon
      ctx.fillStyle = tok("--game-orb", "#ffe6a7");
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(760, 72, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // clouds
      ctx.fillStyle = tok("--game-cloud", "#f4f7ff");
      for (const c of game.current.clouds) {
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

      // birds
      ctx.strokeStyle = tok("--game-bird", "#e8eefc");
      ctx.lineWidth = 2.2;
      for (const b of game.current.birds) {
        const flap = Math.sin(b.f) * 5;
        ctx.beginPath();
        ctx.moveTo(b.x - 10, b.y);
        ctx.quadraticCurveTo(b.x - 5, b.y - 5 - flap, b.x, b.y);
        ctx.quadraticCurveTo(b.x + 5, b.y - 5 - flap, b.x + 10, b.y);
        ctx.stroke();
      }

      // parallax hills
      ctx.fillStyle = tok("--game-hill", "#1b2b47");
      for (let i = 0; i < 6; i++) {
        const x = ((i * 220 - (game.current.t * 1.2) % 1320) + 1320) % 1320 - 200;
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

      // obstacles: traffic cones
      for (const o of game.current.obstacles) {
        const base = GROUND + 46;
        const cw = Math.max(o.w, 22);
        const cx = o.x + cw / 2;
        // base plate
        ctx.fillStyle = tok("--game-cone-dark", "#c2372f");
        ctx.fillRect(o.x - 4, base - 6, cw + 8, 6);
        // cone body
        ctx.fillStyle = tok("--game-cone", "#ff6b35");
        ctx.beginPath();
        ctx.moveTo(cx, base - o.h);
        ctx.lineTo(o.x + cw, base - 6);
        ctx.lineTo(o.x, base - 6);
        ctx.closePath();
        ctx.fill();
        // white stripe
        const sy = base - 6 - o.h * 0.42;
        const halfTop = ((base - 6 - sy) / (o.h - 6)) * (cw / 2);
        ctx.fillStyle = tok("--game-cone-stripe", "#ffffff");
        ctx.beginPath();
        ctx.moveTo(cx - halfTop * 0.72, sy);
        ctx.lineTo(cx + halfTop * 0.72, sy);
        ctx.lineTo(cx + halfTop, sy + o.h * 0.16);
        ctx.lineTo(cx - halfTop, sy + o.h * 0.16);
        ctx.closePath();
        ctx.fill();
      }

      // sky cloud paths
      for (const p of game.current.plats) {
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
        ctx.strokeStyle = tok("--game-plat-edge", "#cfe0ff");
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x + 4, p.y + 1);
        ctx.lineTo(p.x + p.w - 4, p.y + 1);
        ctx.stroke();
      }

      // rain clouds
      for (const rc of game.current.rainClouds) {
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
          const off = (game.current.t * 6 + i * 37) % 150;
          ctx.beginPath();
          ctx.moveTo(rx, rc.y + 28 + off);
          ctx.lineTo(rx - 3, rc.y + 40 + off);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // umbrella pickups
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
        ctx.beginPath();
        ctx.arc(-6, 22, 6, 0, Math.PI);
        ctx.lineWidth = 3;
        ctx.strokeStyle = tok("--game-umbrella-dark", "#c9346b");
        ctx.stroke();
        ctx.restore();
      };
      for (const u of game.current.umbrellas) {
        const bob = Math.sin(game.current.t * 0.08 + u.x * 0.02) * 4;
        drawUmbrella(u.x, u.y + bob, 0.9);
      }

      // ground springs
      for (const s of game.current.springs) {
        const base = GROUND + 46;
        const squash = s.c > 0 ? 0.45 : 1;
        const hgt = 34 * squash;
        ctx.fillStyle = tok("--game-spring-base", "#ff4d6d");
        ctx.fillRect(s.x - 20, base - 6, 40, 6);
        ctx.strokeStyle = tok("--game-spring", "#d8dee9");
        ctx.lineWidth = 5;
        ctx.beginPath();
        const coils = 4;
        for (let i = 0; i <= coils * 12; i++) {
          const tt = i / (coils * 12);
          const yy = base - 6 - tt * hgt;
          const xx = s.x + Math.sin(tt * coils * Math.PI * 2) * 15;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        ctx.fillStyle = tok("--game-spring-dark", "#8fa1bd");
        ctx.fillRect(s.x - 20, base - 6 - hgt - 6, 40, 7);
      }

      // player
      const y = game.current.y;
      const img = heroImg.current;
      if (img && img.complete && img.naturalWidth) {
        const ph2 = 76;
        const pw2 = (img.naturalWidth / img.naturalHeight) * ph2;
        ctx.drawImage(img, 120 + 19 - pw2 / 2, y + 46 - ph2, pw2, ph2);
      } else {
        ctx.fillStyle = tok("--game-player", "#ffd166");
        ctx.fillRect(120, y, 38, 46);
      }
      if (game.current.umbrella > 0) {
        const blink = game.current.umbrella > 90 || game.current.t % 20 < 12;
        if (blink) drawUmbrella(139, y - 34, 1.1);
      }


      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          박현준 러너
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          스페이스바 · 위쪽 화살표 · 화면 터치로 점프하세요
        </p>
      </header>

      <div className="flex w-full max-w-[900px] items-center justify-between text-sm font-semibold text-foreground">
        <span>점수 {score} / {GOAL}</span>
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
          {level}단계
        </span>
        <span className="text-muted-foreground">최고 {best}</span>
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
                ? "달릴 준비 되셨나요? 1000점이 마지막이에요"
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
              {state === "ready"
                ? "게임 시작"
                : state === "clear"
                  ? "다시 도전"
                  : "다시 하기"}
            </button>
          </div>
        )}
      </div>

    </main>
  );
}
