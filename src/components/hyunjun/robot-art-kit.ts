import { createElement as h, Fragment, type ReactNode, type SVGProps } from "react";

// Small drawing helpers for the roster robots, so each body reads as a list of its parts.
export const OUT = "#26303a";
export const G = (...kids: ReactNode[]) => h(Fragment, null, ...kids);
export const r = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  rx = 3,
  stroke = OUT,
  strokeWidth = 2.5,
) => h("rect", { x, y, width, height, rx, fill, stroke, strokeWidth });
export const p = (d: string, fill: string, stroke = OUT, strokeWidth = 2.5) =>
  h("path", { d, fill, stroke, strokeWidth, strokeLinejoin: "round" });
export const c = (cx: number, cy: number, radius: number, fill: string, stroke = OUT, sw = 2.5) =>
  h("circle", { cx, cy, r: radius, fill, stroke, strokeWidth: sw });
export const l = (d: string, stroke = OUT, strokeWidth = 2.5) =>
  h("path", {
    d,
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  });
type GProps = SVGProps<SVGGElement> & { [data: `data-${string}`]: string };
export const g = (props: GProps, ...kids: ReactNode[]) => h("g", props, ...kids);
export const flip = (kids: ReactNode, cx = 100) =>
  g({ transform: `translate(${cx * 2} 0) scale(-1 1)` }, kids);
export const mirror = (kids: ReactNode, cx = 100) => G(kids, flip(kids, cx));
export const at = (x: number, y: number, scale: number, kids: ReactNode) =>
  g({ transform: `translate(${x} ${y}) scale(${scale})` }, kids);
export const shadow = (cx = 100, cy = 208, rx = 62) =>
  h("ellipse", { cx, cy, rx, ry: 6, fill: "#355e6426" });
export const lamp = (x: number, y: number, w: number, height: number, fill: string) =>
  r(x, y, w, height, fill, 1.5, OUT, 1);
export function gear(x: number, y: number, radius: number, fill: string, teeth = 8) {
  return G(
    ...Array.from({ length: teeth }, (_, i) =>
      h("rect", {
        key: i,
        x: x - radius * 0.2,
        y: y - radius * 1.3,
        width: radius * 0.4,
        height: radius * 0.5,
        fill,
        stroke: OUT,
        strokeWidth: 1.5,
        transform: `rotate(${(i * 360) / teeth} ${x} ${y})`,
      }),
    ),
    c(x, y, radius, fill, OUT, 2),
    c(x, y, radius * 0.38, OUT, OUT, 0),
  );
}
export const bolt = (x: number, y: number, scale: number, fill: string) =>
  at(x, y, scale, p("M6 -16 L-8 3 L0 3 L-6 16 L9 -4 L1 -4 Z", fill, OUT, 1.5));
export const star = (x: number, y: number, scale: number, fill: string) =>
  at(x, y, scale, p("M0-10 L3-3 L10-3 L5 2 L7 9 L0 5 L-7 9 L-5 2 L-10-3 L-3-3 Z", fill, OUT, 1.5));
/** Robots with their own approved body; the rest keep the family body in RobotSpeciesArt. */
export const ROSTER_ART_IDS: ReadonlySet<string> = new Set([
  "rb-tira",
  "rb-emblus",
  "rb-police",
  "rb-fire",
  "rb-sky",
  "rb-thunder-police",
]);
const GOLD = "#f5c542";
/** Grade marks every robot shares: a gold belt at 강화, gold shoulder studs too at 강철. */
export function gradeMark(grade: number, x: number, y: number, w: number) {
  if (grade < 1) return null;
  return G(
    r(x, y, w, 6, GOLD, 3, "#8a6a12", 1.5),
    grade >= 2 ? c(x + 4, y - 7, 4, "#d9dfe5", "#7d8790", 1.5) : null,
    grade >= 2 ? c(x + w - 4, y - 7, 4, "#d9dfe5", "#7d8790", 1.5) : null,
  );
}
