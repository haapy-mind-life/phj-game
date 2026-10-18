import { OUTFITS } from "./world-content";
import { GROUND, HEIGHT, PLAYER_X, WIDTH, type Run } from "./runner-engine";
import type { Outfit } from "@/lib/world-model";
import { characterUrl } from "./character-art";
const portraits = new Map<Outfit, HTMLImageElement>();
const colors: Record<string, string> = {
  mint: "#7bb9a2",
  peach: "#e9a08d",
  lavender: "#a99dca",
  ...Object.fromEntries(OUTFITS.map((o) => [o.id, o.color])),
};
export function drawRunner(c: CanvasRenderingContext2D, r: Run, outfit: Outfit) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
  c.fillStyle = r.stage === 4 ? "#ddecf2" : "#e7f3e3";
  c.fillRect(0, 0, WIDTH, HEIGHT);
  c.fillStyle = "#f5dfa5";
  c.beginPath();
  c.arc(700, 65, 30, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#c5dcb5";
  c.beginPath();
  c.ellipse(220, 360, 300, 120, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(610, 365, 360, 130, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#eedfbd";
  c.fillRect(0, GROUND + 8, WIDTH, 62);
  for (const h of r.hazards) {
    c.fillStyle = h.kind === "puddle" ? "#9bcbd0" : "#86b77f";
    c.beginPath();
    c.roundRect(h.x, h.y, h.w, h.h, 14);
    c.fill();
  }
  for (const p of r.pickups) {
    c.font = "26px sans-serif";
    c.fillText(p.kind === "coin" ? "⭐" : p.kind === "box" ? "🎁" : "🍄", p.x, p.y);
  }
  for (const e of r.enemies) {
    c.font = "30px sans-serif";
    c.fillText(e.kind === "air" ? "🦋" : "🐻", e.x, e.y);
  }
  for (const p of r.projectiles) {
    c.font = "18px sans-serif";
    c.fillText("✨", p.x, p.y);
  }
  if (r.activity.startsWith("ladder")) {
    c.strokeStyle = "#bc966f";
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(105, GROUND);
    c.lineTo(105, 120);
    c.moveTo(150, GROUND);
    c.lineTo(150, 120);
    for (let y = 140; y < GROUND; y += 28) {
      c.moveTo(105, y);
      c.lineTo(150, y);
    }
    c.stroke();
  }
  if (r.activity === "crane") {
    c.fillStyle = "#fff7e7";
    c.fillRect(210, 70, 390, 280);
    c.font = "52px sans-serif";
    c.fillText("🧸", 395, 315);
    c.strokeStyle = "#789089";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(r.clawX, 95);
    c.lineTo(r.clawX, r.clawY);
    c.stroke();
  }
  c.save();
  c.translate(PLAYER_X, r.y);
  const s = r.combat.giantTimer > 0 ? 1.25 : 1;
  c.scale(s, s);
  let portrait = portraits.get(outfit);
  if (!portrait) {
    portrait = new Image();
    portrait.src = characterUrl(outfit);
    portraits.set(outfit, portrait);
  }
  if (portrait.complete && portrait.naturalWidth) {
    c.drawImage(portrait, -42, -80, 84, 102);
    c.restore();
    return;
  }
  c.fillStyle = colors[outfit] ?? "#7bb9a2";
  c.beginPath();
  c.arc(0, -62, 34, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffe4c6";
  c.beginPath();
  c.arc(0, -58, 25, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#40564d";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-9, -62);
  c.lineTo(-9, -57);
  c.moveTo(9, -62);
  c.lineTo(9, -57);
  c.stroke();
  c.fillStyle = colors[outfit] ?? "#7bb9a2";
  c.beginPath();
  c.roundRect(-23, -32, 46, 37, 13);
  c.fill();
  c.fillStyle = "#fff0a8";
  c.font = "18px sans-serif";
  c.fillText("★", -9, -8);
  c.strokeStyle = "#75879a";
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(-12, 3);
  c.lineTo(-14, 22);
  c.moveTo(12, 3);
  c.lineTo(14, 22);
  c.stroke();
  c.restore();
}
