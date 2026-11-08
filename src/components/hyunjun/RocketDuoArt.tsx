import type { DuoId } from "@/game/robot/robot-catalog";
import type { DualMode, DualStep } from "@/game/robot/rocket-dual";
import type { ReactNode } from "react";
import { G, OUT, c, flip, g, gradeMark, l, lamp, mirror, p, r, shadow } from "./robot-art-kit";
import "./rocket-duo.css";

// Rocket, Rocket X and Dual Rocket (docs/robot-fusion/2026-11-08-rocket-dual-v1/01). Drawn here
// from the design contract, not traced from the concept poster: pointed V faces (never a box
// head), machine eyes, and two friends that differ in head, shoulders, wheels and wings.
const VB = "-22 -12 244 236";
const CAR_VB = "0 0 260 150";

const ROCKET = { a: "#d8322c", b: "#9e1f1c", w: "#f5f2ec", gold: "#f4c542", glow: "#7cc8ff" };
const XR = { a: "#1f4fb8", b: "#14306e", k: "#1d222b", w: "#eef3fb", cyan: "#22d3ee" };
const JOINT = "#3a424c";

/** The little rocket badge: a body with a window and two fins. */
const rocketMark = (x: number, y: number, s: number) =>
  g(
    { transform: `translate(${x} ${y}) scale(${s}) rotate(35)` },
    p("M0 -14 C6 -8 6 4 4 9 H-4 C-6 4 -6 -8 0 -14 Z", ROCKET.w, OUT, 1.6),
    c(0, -3, 2.6, ROCKET.glow, OUT, 1.2),
    p("M-4 4 L-9 11 L-4 9 Z M4 4 L9 11 L4 9 Z", ROCKET.a, OUT, 1.2),
    p("M-2.5 9 L0 15 L2.5 9 Z", "#ff9a3c", OUT, 1),
  );
/** Rocket X's mark: a bold X, not a rocket, so the two never read alike. */
const xMark = (x: number, y: number, s: number, fill = XR.cyan) =>
  g(
    { transform: `translate(${x} ${y}) scale(${s})` },
    p(
      "M-10 -10 L-4 -10 L0 -4 L4 -10 L10 -10 L3 0 L10 10 L4 10 L0 4 L-4 10 L-10 10 L-3 0 Z",
      fill,
      OUT,
      1.6,
    ),
  );
const wheel = (x: number, y: number, radius: number, rim: string) =>
  G(
    c(x, y, radius, "#22262d", OUT, 2),
    c(x, y, radius * 0.55, rim, OUT, 1.5),
    c(x, y, radius * 0.18, OUT, OUT, 0),
  );

// ── Rocket ── red, white and gold. Gold V crest, small gold wings, wheels on the calves.
function rocketBody(grade: number) {
  const leg = G(
    r(70, 138, 24, 46, ROCKET.a, 5),
    r(70, 146, 24, 8, ROCKET.w, 2),
    wheel(64, 168, 9, ROCKET.gold),
    p("M66 184 H98 L100 202 H62 Z", ROCKET.b),
  );
  const wing = p("M58 76 L18 54 L26 70 L12 74 L30 84 L22 92 L56 96 Z", ROCKET.gold);
  return G(
    shadow(100, 208, 58),
    g({ className: "hj-mech-wing" }, mirror(wing)),
    g({ className: "hj-mech-leg left" }, leg),
    g({ className: "hj-mech-leg right" }, flip(leg)),
    // chest: a red plate with a white core and the rocket badge
    p("M62 72 H138 L130 140 H70 Z", ROCKET.a),
    p("M76 82 H124 L116 120 H84 Z", ROCKET.w),
    c(100, 101, 13, ROCKET.glow, OUT, 2),
    rocketMark(100, 101, 0.9),
    r(84, 124, 32, 10, ROCKET.gold, 3),
    gradeMark(grade, 72, 134, 56),
    // shoulders: round red armour with a gold rim
    mirror(
      G(p("M40 64 Q62 56 70 70 L66 92 H38 Z", ROCKET.a), l("M42 66 Q60 60 68 72", ROCKET.gold, 3)),
    ),
    r(30, 92, 20, 46, ROCKET.a, 6),
    r(150, 92, 20, 46, ROCKET.a, 6),
    c(40, 146, 10, JOINT),
    c(160, 146, 10, JOINT),
    g(
      { className: "hj-roster-weapon", "data-weapon-part": "fist" },
      c(160, 146, 13, ROCKET.gold),
      l("M168 136 L182 124 M170 146 L188 146 M168 156 L182 168", "#ff9a3c", 3),
    ),
    // head: pointed V face under a red helmet and a tall gold V crest
    p("M76 36 H124 L128 56 L100 76 L72 56 Z", ROCKET.w),
    p("M72 34 Q100 18 128 34 L124 46 H76 Z", ROCKET.a),
    p("M100 40 L70 4 L84 6 L100 26 L116 6 L130 4 Z", ROCKET.gold),
    rocketMark(100, 30, 0.55),
    p("M80 50 L96 54 L94 60 L82 58 Z", "#1f2a33", OUT, 1.5),
    p("M120 50 L104 54 L106 60 L118 58 Z", "#1f2a33", OUT, 1.5),
    lamp(85, 54, 8, 3, ROCKET.glow),
    lamp(107, 54, 8, 3, ROCKET.glow),
    l("M94 66 Q100 70 106 66", OUT, 2),
  );
}

// ── Rocket X ── deep blue, black and white. Wide swept horns with an X, angular shoulders with
// shiny wheels on them, blue fin wings, cyan lights.
function rocketXBody(grade: number) {
  const leg = G(
    p("M70 138 H94 L96 184 H66 Z", XR.k),
    p("M72 150 H92 L90 160 H74 Z", XR.cyan, OUT, 1.5),
    p("M64 184 H100 L104 202 H60 Z", XR.a),
  );
  const fin = G(
    p("M56 96 L2 70 L18 98 L-4 118 L54 116 Z", XR.a),
    l("M44 102 L10 84 M44 110 L8 110", XR.cyan, 2),
  );
  return G(
    shadow(100, 208, 58),
    g({ className: "hj-mech-wing" }, mirror(fin)),
    g({ className: "hj-mech-leg left" }, leg),
    g({ className: "hj-mech-leg right" }, flip(leg)),
    // chest: a black wedge with a white plate and the X
    p("M60 70 L140 70 L128 142 H72 Z", XR.k),
    p("M74 80 H126 L100 126 Z", XR.w),
    xMark(100, 96, 1.05),
    r(86, 128, 28, 8, XR.cyan, 2),
    gradeMark(grade, 72, 136, 56),
    // shoulders: sharp blue pauldrons with a glossy wheel on top
    mirror(G(p("M70 66 L34 58 L30 90 L66 92 Z", XR.a), wheel(44, 64, 11, XR.cyan))),
    p("M32 92 H50 L52 138 H28 Z", XR.k),
    p("M168 92 H150 L148 138 H172 Z", XR.k),
    c(40, 146, 10, JOINT),
    c(160, 146, 10, JOINT),
    g({ className: "hj-roster-weapon", "data-weapon-part": "cutter" }, xMark(170, 140, 1.3)),
    // head: pointed V face in a black helmet, horns swept out wide, blue X on the brow
    p("M78 38 H122 L126 56 L100 76 L74 56 Z", XR.w),
    p("M72 36 Q100 20 128 36 L122 48 H78 Z", XR.k),
    p("M76 38 L26 18 L44 34 L74 46 Z", XR.a),
    p("M124 38 L174 18 L156 34 L126 46 Z", XR.a),
    xMark(100, 32, 0.75),
    p("M80 52 L97 55 L95 60 L80 58 Z", "#0f1620", OUT, 1.5),
    p("M120 52 L103 55 L105 60 L120 58 Z", "#0f1620", OUT, 1.5),
    lamp(84, 55, 9, 3, XR.cyan),
    lamp(107, 55, 9, 3, XR.cyan),
    l("M95 67 Q100 69 105 67", OUT, 2),
  );
}

// ── Cars (side view, facing right) ── each car carries its robot's colours and mark.
function rocketCar() {
  return G(
    p("M14 104 L30 78 L96 64 L150 52 L204 62 L246 86 L250 108 L14 112 Z", ROCKET.a),
    p("M104 62 L150 54 L190 64 L176 78 H112 Z", "#2c3e55", OUT, 2),
    p("M30 96 H246", ROCKET.gold),
    l("M24 96 L244 92", ROCKET.gold, 5),
    rocketMark(214, 82, 0.9),
    p("M14 74 L40 70 L42 82 L18 86 Z", ROCKET.gold),
    l("M16 66 L34 76", ROCKET.gold, 3),
    r(132, 44, 30, 8, ROCKET.w, 3),
    lamp(134, 45, 12, 6, "#ff3b30"),
    lamp(148, 45, 12, 6, "#3b82f6"),
    lamp(238, 92, 10, 6, "#fff4b0"),
    wheel(62, 112, 20, ROCKET.gold),
    wheel(202, 112, 20, ROCKET.gold),
  );
}
function rocketXCar() {
  return G(
    p("M12 106 L24 86 L104 70 L168 60 L222 72 L252 94 L252 110 L12 114 Z", XR.k),
    p("M112 70 L166 62 L204 72 L190 84 H118 Z", "#13324f", OUT, 2),
    l("M26 100 L250 98", XR.a, 6),
    xMark(222, 88, 0.95),
    p("M10 78 L36 74 L38 88 L14 92 Z", XR.a),
    l("M12 70 L30 80", XR.a, 3),
    lamp(244, 96, 8, 5, XR.cyan),
    lamp(130, 52, 26, 6, XR.cyan),
    wheel(64, 114, 20, XR.cyan),
    wheel(204, 114, 20, XR.cyan),
  );
}

/** Cars are drawn facing right; like Emblus's ambulance they face left by default, and
 * `facing` > 0 turns them round while they drive right. */
const carLeft = (kids: ReactNode) => g({ transform: "translate(260 0) scale(-1 1)" }, kids);
const svgSize = (car: boolean, size: number) => {
  const viewBox = car ? CAR_VB : VB;
  const [, , vw, vh] = viewBox.split(" ").map(Number) as [number, number, number, number];
  const height = size * (car ? 0.8 : 1.25);
  return { viewBox, width: (height * vw) / vh, height };
};

/** Rocket or Rocket X, as a robot or as its own car. */
export function RocketDuoArt({
  id,
  grade = 0,
  moving = false,
  weaponOut = false,
  size = 96,
  label,
  form = "robot",
  changing = false,
  facing = -1,
}: {
  id: DuoId;
  grade?: number;
  moving?: boolean;
  weaponOut?: boolean;
  size?: number;
  label: string;
  form?: "robot" | "car";
  changing?: boolean;
  facing?: number;
}) {
  const car = form === "car";
  const { viewBox, width, height } = svgSize(car, size);
  const turns = car && facing > 0;
  const art: ReactNode = car
    ? carLeft(id === "rb-rocket" ? rocketCar() : rocketXCar())
    : id === "rb-rocket"
      ? rocketBody(grade)
      : rocketXBody(grade);
  return (
    <svg
      className={`hj-mech hj-roster hj-rocket${moving ? " moving" : ""}${weaponOut ? " weapon-out" : ""}${changing ? " changing" : ""}`}
      viewBox={viewBox}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      data-roster={id}
      data-form={form}
      data-facing={turns ? "right" : "left"}
      data-weapon={weaponOut ? "drawn" : "stowed"}
      style={turns ? { transform: "scaleX(-1)" } : undefined}
    >
      {art}
    </svg>
  );
}

// ── Dual Rocket ── one body: Rocket's red arm and leg on the left, Rocket X's blue ones on the
// right, gold and blue wings behind, a crest that joins the V and the X, one big core.
function dualBody() {
  return G(
    shadow(100, 208, 70),
    // wings: Rocket's gold on the left, Rocket X's blue on the right
    p("M60 70 L-8 30 L4 58 L-14 66 L8 80 L-6 92 L58 98 Z", ROCKET.gold),
    p("M140 70 L208 30 L196 58 L214 66 L192 80 L206 92 L142 98 Z", XR.a),
    // legs
    G(
      r(66, 140, 28, 46, ROCKET.a, 5),
      wheel(60, 168, 10, ROCKET.gold),
      p("M62 186 H98 L100 204 H58 Z", ROCKET.b),
    ),
    G(
      p("M106 140 H134 L138 186 H104 Z", XR.k),
      p("M108 152 H132 L130 162 H110 Z", XR.cyan, OUT, 1.5),
      p("M102 186 H140 L144 204 H100 Z", XR.a),
    ),
    // torso: red half and blue half around one core
    p("M56 68 H100 V146 H66 Z", ROCKET.a),
    p("M100 68 H144 L134 146 H100 Z", XR.k),
    p("M72 80 H128 L118 126 H82 Z", ROCKET.w),
    c(100, 102, 17, XR.cyan, OUT, 2.5),
    c(100, 102, 10, "#e6fbff", OUT, 1.5),
    rocketMark(94, 102, 0.6),
    xMark(107, 102, 0.45, XR.a),
    r(80, 130, 40, 9, ROCKET.gold, 3),
    // shoulders and arms
    p("M36 62 Q60 52 68 68 L64 94 H32 Z", ROCKET.a),
    l("M38 64 Q58 56 66 70", ROCKET.gold, 3),
    p("M132 66 L170 58 L172 92 L136 94 Z", XR.a),
    wheel(158, 62, 11, XR.cyan),
    r(28, 94, 22, 48, ROCKET.a, 6),
    p("M150 94 H170 L174 142 H148 Z", XR.k),
    c(39, 150, 11, ROCKET.gold),
    c(161, 150, 11, JOINT),
    // head: one pointed face; the gold V and the blue horns meet in one crest
    p("M76 36 H124 L128 56 L100 78 L72 56 Z", ROCKET.w),
    p("M72 34 Q100 16 128 34 L124 46 H76 Z", ROCKET.a),
    p("M100 34 Q114 20 128 34 L124 46 H100 Z", XR.k),
    p("M100 40 L68 0 L84 4 L100 24 Z", ROCKET.gold),
    p("M100 40 L132 0 L116 4 L100 24 Z", XR.a),
    p("M124 38 L172 18 L156 34 L126 46 Z", XR.a),
    p("M76 38 L28 18 L44 34 L74 46 Z", ROCKET.gold),
    c(100, 30, 6, XR.cyan, OUT, 1.5),
    p("M80 50 L96 54 L94 60 L82 58 Z", "#1f2a33", OUT, 1.5),
    p("M120 50 L104 54 L106 60 L118 58 Z", "#0f1620", OUT, 1.5),
    lamp(85, 54, 8, 3, ROCKET.glow),
    lamp(107, 54, 8, 3, XR.cyan),
    l("M94 67 Q100 71 106 67", OUT, 2),
  );
}
function dualCar() {
  return G(
    p("M10 104 L26 80 L100 64 L156 52 L212 62 L250 86 L252 110 L10 114 Z", ROCKET.a),
    p("M140 56 L212 62 L250 86 L252 110 L140 112 Z", XR.a),
    p("M104 62 L152 54 L194 64 L180 78 H112 Z", "#2c3e55", OUT, 2),
    l("M22 98 L250 94", ROCKET.gold, 5),
    // side wings on both ends: gold at the back, blue at the front
    p("M16 76 L44 70 L46 84 L20 88 Z", ROCKET.gold),
    p("M150 84 L196 70 L188 92 L150 96 Z", XR.cyan),
    // fusion mark on the nose: the rocket inside the X
    xMark(222, 84, 1, ROCKET.gold),
    rocketMark(222, 84, 0.55),
    lamp(240, 92, 10, 6, XR.cyan),
    lamp(128, 46, 12, 6, "#ff3b30"),
    lamp(142, 46, 12, 6, XR.cyan),
    wheel(62, 114, 21, ROCKET.gold),
    wheel(204, 114, 21, XR.cyan),
  );
}

/** Dual Rocket as a robot or as the one dual car. */
export function DualRocketArt({
  mode = "robot",
  size = 120,
  label = "듀얼 로켓",
  weaponOut = false,
  moving = false,
  changing = false,
  facing = -1,
}: {
  mode?: DualMode;
  size?: number;
  label?: string;
  weaponOut?: boolean;
  moving?: boolean;
  changing?: boolean;
  facing?: number;
}) {
  const car = mode === "car";
  const { viewBox, width, height } = svgSize(car, size);
  const turns = car && facing > 0;
  return (
    <svg
      className={`hj-mech hj-roster hj-rocket-dual${moving ? " moving" : ""}${weaponOut ? " weapon-out" : ""}${changing ? " changing" : ""}`}
      viewBox={viewBox}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      data-roster="dual-rocket"
      data-form={mode}
      data-facing={turns ? "right" : "left"}
      style={turns ? { transform: "scaleX(-1)" } : undefined}
    >
      {car ? carLeft(dualCar()) : dualBody()}
    </svg>
  );
}

const STEP_LABEL: Record<DualStep, string> = {
  gather: "1 합체 준비",
  link: "2 에너지 연결",
  assemble: "3 합체 변형",
  reveal: "4 듀얼 로켓 완성!",
};
/**
 * The 10 s fusion on stage: the two friends stand side by side, an energy link joins their
 * cores, their parts lock into one body, then Dual Rocket appears. A big countdown shows how
 * long is left; with reduced motion the steps still change, only the movement stops.
 */
export function DualFusionStage({
  step,
  seconds,
  size = 120,
}: {
  step: DualStep;
  seconds: number;
  size?: number;
}) {
  return (
    <div className="hj-dual-stage" data-dual-step={step} data-dual-seconds={seconds}>
      <div className="hj-dual-head" role="status">
        <span className="hj-dual-count">{seconds}</span>
        <b className="hj-dual-step">{STEP_LABEL[step]}</b>
      </div>
      {step === "reveal" ? (
        <div className="hj-dual-reveal">
          <DualRocketArt size={size} label="듀얼 로켓 완성" />
        </div>
      ) : (
        <div className="hj-dual-pair">
          <div className="hj-dual-member left">
            <RocketDuoArt id="rb-rocket" label="로켓" size={size * 0.5} moving />
          </div>
          {step !== "gather" && <div className="hj-dual-link" />}
          <div className="hj-dual-member right">
            <RocketDuoArt id="rb-rocket-x" label="로켓 X" size={size * 0.5} moving />
          </div>
        </div>
      )}
    </div>
  );
}
