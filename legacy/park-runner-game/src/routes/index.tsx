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

const W = 900;
const H = 340;
const GROUND = 280;

const GOAL = 1000;
const levelOf = (s: number) => Math.min(20, Math.floor(s / 50) + 1);

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

    const loop = () => {
      const g = game.current;
      if (g.running) {
        g.t += 1;
        g.speed = 7 + g.t / 700;
        g.vy += 0.78;
        g.y = Math.min(GROUND, g.y + g.vy);

        if (
          g.obstacles.length === 0 ||
          g.obstacles[g.obstacles.length - 1]!.x < W - 260 - Math.random() * 240
        ) {
          const h = 32 + Math.random() * 46;
          g.obstacles.push({ x: W + 40, w: 20 + Math.random() * 22, h });
        }
        g.obstacles.forEach((o) => (o.x -= g.speed));
        g.obstacles = g.obstacles.filter((o) => o.x + o.w > -20);

        const px = 120;
        const pw = 38;
        const ph = 46;
        for (const o of g.obstacles) {
          if (
            px + pw > o.x &&
            px < o.x + o.w &&
            g.y > GROUND - o.h + 6
          ) {
            g.running = false;
            setState("over");
            const s = Math.floor(g.score);
            setBest((b) => {
              const nb = Math.max(b, s);
              try {
                localStorage.setItem("runner-best", String(nb));
              } catch {
                /* ignore */
              }
              return nb;
            });
          }
        }
        g.score += g.speed / 12;
        setScore(Math.floor(g.score));
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, tok("--game-sky-top", "#101a2e"));
      sky.addColorStop(1, tok("--game-sky-bottom", "#233657"));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

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
        <span>점수 {score}</span>
        <span className="text-muted-foreground">최고 {best}</span>
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
        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/50 text-center backdrop-blur-[2px]">
            <img
              src={heroAsset.url}
              alt="박현준 선수"
              className="h-24 w-auto drop-shadow-lg sm:h-32"
            />
            <p className="text-lg font-bold text-background">
              {state === "ready" ? "달릴 준비 되셨나요?" : `게임 종료! 점수 ${score}`}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {state === "ready" ? "게임 시작" : "다시 하기"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
