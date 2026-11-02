import type { JSX } from "react";
import type { LegendId } from "@/game/robot/robot-catalog";
import {
  G,
  OUT,
  bolt,
  c,
  flip,
  g,
  gear,
  gradeMark,
  l,
  lamp,
  mirror,
  p,
  r,
  shadow,
} from "./robot-art-kit";

// The six legends as approved on the design sheets (2026-11-02). Each has its own silhouette,
// weapon, joints and glowing part. Base frame: centred on x=100, feet near y=204.
export type LegendParts = { grade: number; out: boolean };
const weapon = (out: boolean, ...kids: Parameters<typeof G>) =>
  g({ className: `hj-lg-weapon${out ? " out" : ""}` }, ...kids);
const legs = (leg: ReturnType<typeof G>) =>
  G(g({ className: "hj-lg-leg l" }, leg), g({ className: "hj-lg-leg r" }, flip(leg)));
const core = (x: number, y: number, radius: number, f: string) =>
  g({ className: "hj-lg-core" }, c(x, y, radius, f));

function shieldBody({ grade, out }: LegendParts) {
  const A = "#c9d3dd",
    C = "#3f6fd1",
    J = "#3f4a55";
  return G(
    shadow(100, 208, 74),
    legs(G(r(62, 136, 32, 48, A, 3), r(58, 184, 42, 18, J, 5))),
    p("M56 66 H144 L134 142 H66 Z", A),
    r(72, 76, 56, 42, C, 5),
    core(100, 97, 11, "#fff2a8"),
    gradeMark(grade, 68, 124, 64),
    r(114, 44, 64, 48, C, 10),
    r(122, 36, 48, 14, A, 4),
    r(148, 92, 26, 48, A, 5),
    c(161, 146, 10, J),
    r(32, 62, 40, 30, A, 6),
    weapon(
      out,
      p("M2 44 H64 V158 L33 196 L2 158 Z", A),
      p("M10 52 H56 V154 L33 182 L10 154 Z", C),
      l("M10 86 H56 M10 120 H56", "#e7eef5", 3.5),
      c(33, 103, 9, "#fff2a8"),
    ),
    r(78, 36, 44, 30, A, 5),
    r(84, 44, 32, 14, "#1f2a33", 3),
    lamp(88, 48, 9, 6, "#7ff3ff"),
    lamp(103, 48, 9, 6, "#7ff3ff"),
    p("M90 36 L100 22 L110 36 Z", C),
  );
}
function wingBody({ grade, out }: LegendParts) {
  const A = "#f4f8fb",
    C = "#1fb5a8";
  return G(
    shadow(100, 208, 60),
    g(
      { className: "hj-lg-wings" },
      mirror(
        G(
          p("M78 74 L0 14 L4 52 L22 56 L10 76 L34 82 L24 102 L74 112 Z", A),
          l("M66 86 L14 34 M66 96 L28 66 M68 104 L44 88", C),
          c(70, 92, 5, "#ffe27a", OUT, 1.5),
        ),
      ),
    ),
    legs(
      G(
        r(82, 132, 16, 50, A, 4),
        p("M82 150 L74 164 L84 176 Z", C),
        p("M74 202 L80 182 H100 V202 Z", C),
      ),
    ),
    p("M78 66 H122 L116 130 H84 Z", A),
    p("M88 74 H112 L100 100 Z", C),
    core(100, 114, 6, "#ffe27a"),
    gradeMark(grade, 84, 120, 32),
    mirror(G(r(64, 70, 14, 18, C, 4), r(66, 88, 10, 40, A, 4), c(71, 134, 6, C))),
    weapon(out, p("M126 134 L176 88 L180 92 L132 140 Z", "#b9fff2", C, 2)),
    p("M84 62 L80 36 L100 26 L120 36 L116 62 Z", A),
    p("M84 40 H116 L112 52 H88 Z", "#16323a"),
    lamp(89, 43, 7, 5, C),
    lamp(104, 43, 7, 5, C),
    p("M100 26 L92 8 L100 14 L108 8 Z", C),
  );
}
function deepBody({ grade, out }: LegendParts) {
  const A = "#24407a",
    B = "#172a52",
    J = "#4fd6e0";
  return G(
    shadow(100, 208, 66),
    legs(G(r(66, 140, 28, 40, A, 4), p("M56 202 L66 180 H94 L104 202 Z", J))),
    p("M56 72 H144 L136 142 H64 Z", A),
    r(72, 84, 56, 44, "#b9eef5", 20, J, 3),
    c(90, 108, 5, "#ffffff", J, 1.5),
    c(106, 98, 3.5, "#ffffff", J, 1.5),
    c(112, 114, 4.5, "#ffffff", J, 1.5),
    gradeMark(grade, 66, 130, 68),
    mirror(G(c(46, 88, 18, A), r(34, 104, 24, 36, B, 6), c(46, 148, 11, J))),
    weapon(out, r(148, 126, 46, 20, B, 8), c(194, 136, 8, J)),
    c(100, 46, 28, "#b9eef5"),
    c(100, 46, 20, B, A, 3),
    core(100, 46, 10, "#fff2a8"),
    l("M74 34 Q100 12 126 34", A, 5),
    r(96, 6, 8, 14, J, 2),
  );
}
function steelBody({ grade, out }: LegendParts) {
  const A = "#5a6470",
    B = "#3a4149",
    J = "#f08a2c";
  return G(
    shadow(100, 210, 86),
    legs(
      G(
        r(50, 150, 44, 34, A, 4),
        c(72, 150, 11, J),
        c(72, 150, 4, B, OUT, 0),
        r(42, 184, 58, 20, B, 4),
      ),
    ),
    p("M34 62 H166 L150 152 H50 Z", A),
    r(58, 76, 84, 50, B, 4),
    r(70, 86, 60, 10, J, 1),
    r(70, 104, 60, 10, J, 1),
    gradeMark(grade, 56, 134, 88),
    mirror(G(c(26, 78, 24, B), core(26, 78, 12, J), r(10, 100, 32, 44, A, 4), c(26, 152, 15, B))),
    weapon(
      out,
      r(168, 20, 14, 130, "#8a5f3a", 2),
      r(138, 0, 74, 44, B, 4),
      r(144, 10, 62, 8, J, 1),
      r(144, 26, 62, 8, J, 1),
    ),
    c(174, 152, 15, B),
    r(82, 38, 36, 26, A, 3),
    r(86, 44, 28, 12, "#1b2026", 2),
    lamp(90, 47, 7, 5, "#ffb347"),
    lamp(103, 47, 7, 5, "#ffb347"),
  );
}
function thunderBody({ grade, out }: LegendParts) {
  const A = "#ffd23f",
    C = "#7a3fc9",
    K = "#2a1a4a";
  return G(
    shadow(100, 208, 56),
    flip(
      g(
        { opacity: 0.28 },
        p("M50 76 L30 200 L60 200 L66 86 Z", A, "none", 0),
        p("M36 96 L14 190 L34 190 L46 104 Z", A, "none", 0),
      ),
    ),
    legs(
      G(
        p("M78 132 L96 132 L92 182 L80 182 Z", A),
        c(87, 158, 5, C),
        p("M66 202 L78 184 H96 L96 202 Z", C),
      ),
    ),
    p("M70 66 H130 L118 132 H82 Z", A),
    p("M82 76 H118 L110 112 H90 Z", C),
    bolt(100, 94, 1, "#ffe45c"),
    gradeMark(grade, 80, 118, 40),
    mirror(
      G(c(62, 76, 14, C), core(62, 76, 7, "#ffe45c"), l("M56 90 L44 122", A, 11), c(42, 128, 7, C)),
    ),
    weapon(
      out,
      p("M152 196 L164 12 L170 12 L162 196 Z", "#fff7b0", C, 2),
      bolt(168, 22, 1.4, "#ffe45c"),
    ),
    c(158, 128, 7, C),
    bolt(40, 44, 1, "#ffe45c"),
    bolt(186, 92, 0.8, "#ffe45c"),
    p("M78 62 L72 34 L100 24 L128 34 L122 62 Z", A),
    p("M78 38 H122 L116 52 H84 Z", K),
    lamp(84, 41, 10, 6, "#fff"),
    lamp(106, 41, 10, 6, "#fff"),
    bolt(78, 20, 0.85, C),
    bolt(122, 20, 0.85, C),
  );
}
function guardianBody({ grade, out }: LegendParts) {
  const A = "#e9b730",
    C = "#fbf6e6",
    J = "#7a5d12";
  return G(
    shadow(100, 208, 74),
    g(
      { className: "hj-lg-halo" },
      c(100, 92, 82, "none", A, 7),
      c(100, 92, 68, "none", C, 2.5),
      ...[0, 60, 120, 180, 240, 300].map((d) =>
        g({ key: d, transform: `rotate(${d} 100 92)` }, c(100, 10, 6, C, OUT, 2)),
      ),
    ),
    legs(G(r(66, 140, 28, 42, A, 4), r(66, 150, 28, 8, C, 1), r(58, 182, 44, 20, J, 4))),
    p("M56 70 H144 L136 142 H64 Z", A),
    c(100, 104, 23, C),
    core(100, 104, 15, "#7ff3ff"),
    c(100, 104, 6, "#fff"),
    gradeMark(grade, 66, 132, 68),
    mirror(G(r(26, 60, 38, 30, C, 9), r(30, 90, 24, 48, A, 5), c(42, 146, 11, J))),
    weapon(out, c(158, 146, 22, "none", C, 5)),
    r(78, 38, 44, 32, A, 6),
    r(84, 46, 32, 14, "#2b2410", 3),
    lamp(88, 50, 9, 6, "#7ff3ff"),
    lamp(103, 50, 9, 6, "#7ff3ff"),
    gear(100, 26, 13, A),
  );
}
export const LEGEND_BODIES: Record<LegendId, (p: LegendParts) => JSX.Element> = {
  "lg-shield": shieldBody,
  "lg-wing": wingBody,
  "lg-deep": deepBody,
  "lg-steel": steelBody,
  "lg-thunder": thunderBody,
  "lg-guardian": guardianBody,
};
