import type { RobotSpeciesId } from "@/game/robot/robot-catalog";
import type { RobotForm } from "@/game/robot/robot-forms";
import type { ReactNode } from "react";
import "./robot-roster.css";
import {
  G,
  OUT,
  at,
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
  star,
} from "./robot-art-kit";

// The featured robots as approved on the design sheets (2026-11-02): each one has its own body,
// weapon and joints, not a recolour. Machine eyes only, never a human face.
const VB = "-22 -12 244 236";
const WIDE = "-4 -2 250 222";

// ── Tira ── small closed-mouth T-rex, upright triangle eyes; never a fruit, leaf or lattice.
const T = { a: "#2c7f8f", b: "#1b4f5c", c: "#dbe6e8", g: "#ffb02e", j: "#3a424c" };
const triEye = (x: number, y: number, w: number, h: number) =>
  p(`M${x} ${y} L${x - w / 2} ${y + h} L${x + w / 2} ${y + h} Z`, T.g, OUT, 4);
/** The face on its own, also what locks onto Emblus's chest in the special fusion. */
const tiraFace = () =>
  G(
    p("M72 44 H128 L136 58 L120 86 H80 L64 58 Z", T.a),
    p("M72 44 H128 L132 52 H68 Z", T.b),
    triEye(85, 52, 20, 20),
    triEye(115, 52, 20, 20),
    l("M82 79 H118", OUT, 3.5),
  );
function tiraBody(grade: number, swing: boolean) {
  const tail = G(
    p("M128 106 L190 92 L196 98 L134 140 Z", T.a),
    p("M176 95 L190 92 L196 98 L170 112 Z", T.c),
    l("M148 103 L152 126 M164 99 L166 116", T.b),
  );
  return G(
    shadow(112, 208, 70),
    g(
      { className: "hj-mech-leg left" },
      p("M108 140 L128 168 L120 196 L102 196 Z", T.b),
      p("M122 194 L120 206 L92 206 L90 200 L102 192 Z", T.b),
    ),
    g(
      { className: "hj-roster-weapon", "data-weapon-part": "tail" },
      swing
        ? G(
            g({ transform: "rotate(-34 130 122)" }, tail),
            l("M196 40 Q214 78 198 118", "#f08a2c", 4),
            l("M182 30 Q204 52 200 74", "#f08a2c", 3),
          )
        : tail,
    ),
    p("M70 92 L104 84 L138 104 L136 138 L104 150 L76 128 Z", T.a),
    p("M74 104 L92 100 L106 146 L80 128 Z", T.c),
    l("M80 112 L97 108 M86 124 L101 120", T.b, 2),
    p("M98 85 L108 74 L114 92 Z", T.b),
    p("M116 93 L128 84 L130 101 Z", T.b),
    p("M62 70 L84 66 L92 98 L68 98 Z", T.j),
    g(
      { transform: "translate(72 78) scale(.84) translate(-72 -78)", "data-tira-face": "closed" },
      p("M74 40 L46 38 L18 58 L14 72 L22 80 L70 82 L80 62 Z", T.a),
      p("M74 40 L46 38 L34 47 L78 50 Z", T.b),
      triEye(46, 47, 20, 19),
      l("M18 71 L68 74", OUT, 3.5),
    ),
    l("M86 112 L68 124", T.j, 6),
    p("M60 120 L72 122 L66 133 Z", T.c),
    gradeMark(grade, 88, 112, 40),
    g(
      { className: "hj-mech-leg right" },
      p("M102 122 L134 118 L138 148 L122 166 L104 150 Z", T.a),
      l("M110 132 L130 128", T.b, 2),
      c(122, 164, 7.5, T.j),
      p("M116 170 L130 170 L122 196 L108 196 Z", T.b),
      p("M126 194 L122 206 L80 206 L76 200 L92 192 Z", T.c),
      l("M90 198 L88 206 M104 196 L102 206", OUT, 2),
    ),
  );
}
const EGG =
  "M100 26 C142 26 168 92 168 140 C168 186 136 206 100 206 C64 206 32 186 32 140 C32 92 58 26 100 26 Z";
const eggBody = () =>
  G(
    shadow(100, 210, 72),
    p(EGG, T.a),
    p("M100 26 C124 26 144 50 156 84 H44 C56 50 76 26 100 26 Z", T.b),
    l("M38 112 C70 124 130 124 162 112", T.c, 6),
    l("M100 26 V84", T.j),
    gear(100, 158, 22, T.c),
    triEye(100, 50, 24, 24),
    ...[
      [56, 96],
      [144, 96],
      [60, 178],
      [140, 178],
    ].map(([x, y]) => c(x!, y!, 3.5, T.c, OUT, 1.5)),
  );
const eggOpening = () =>
  G(
    shadow(100, 210, 72),
    g(
      { transform: "translate(0 6)" },
      p(
        "M36 124 L60 136 L80 124 L100 136 L120 124 L140 136 L164 124 C170 170 136 204 100 204 C64 204 30 170 36 124 Z",
        T.a,
      ),
    ),
    at(38, 66, 0.62, tiraFace()),
    p("M150 118 L190 96 L194 104 L154 134 Z", T.a),
    at(-6, -8, 0.8, p("M46 92 C50 56 74 26 100 26 C110 26 118 30 126 38 L96 98 L66 82 Z", T.b)),
    gear(100, 166, 17, T.c),
    l("M56 150 H74 M126 150 H144", T.b, 3),
  );

// ── Emblus ── big rescue robot, small head, one eye, one solid green lens, no nose.
const E = {
  red: "#d8403a",
  white: "#f3f5f7",
  grey: "#8d99a6",
  green: "#23c267",
  dark: "#2a333d",
  glass: "#a6dceb",
  eye: "#7ff3ff",
  light: "#ffd23f",
};
const plus = (x: number, y: number, s: number, f: string) =>
  p(
    `M${x - s / 3} ${y - s} H${x + s / 3} V${y - s / 3} H${x + s} V${y + s / 3} H${x + s / 3} V${y + s} H${x - s / 3} V${y + s / 3} H${x - s} V${y - s / 3} H${x - s / 3} Z`,
    f,
    OUT,
    1.8,
  );
/** The antidote weapon: stag-beetle jaws on a handle the hand really holds. */
const clamp = (x = 163, y = 112) => {
  const jaw = G(
    p(
      `M${x} ${y} C${x - 24} ${y - 14} ${x - 28} ${y - 48} ${x - 10} ${y - 70} C${x - 13} ${y - 48} ${x - 6} ${y - 30} ${x + 1} ${y - 22} Z`,
      E.green,
    ),
    p(`M${x - 16} ${y - 40} l8 -3 l-1 8 Z`, "#d6ffe6", OUT, 1.2),
    p(`M${x - 12} ${y - 26} l8 -2 l-2 7 Z`, "#d6ffe6", OUT, 1.2),
  );
  return G(
    jaw,
    flip(jaw, x),
    r(x - 5, y - 6, 10, 12, E.grey, 2),
    r(x - 4, y + 4, 8, 50, E.dark, 2),
    r(x - 5, y + 52, 10, 6, E.grey, 2),
  );
};
const antidoteSword = (x = 163, y = 112) => {
  const claw = p(
    `M${x - 8} ${y} L${x - 30} ${y - 6} L${x - 34} ${y + 4} L${x - 26} ${y + 6} L${x - 28} ${y + 13} L${x - 8} ${y + 8} Z`,
    T.c,
  );
  return G(
    p(
      `M${x - 9} ${y - 2} L${x - 6} ${y - 92} L${x} ${y - 108} L${x + 6} ${y - 92} L${x + 9} ${y - 2} Z`,
      T.a,
    ),
    p(
      `M${x - 3} ${y - 4} L${x - 2} ${y - 90} L${x} ${y - 100} L${x + 2} ${y - 90} L${x + 3} ${y - 4} Z`,
      E.green,
      OUT,
      1,
    ),
    l(`M${x - 8} ${y - 30} H${x + 8} M${x - 7} ${y - 58} H${x + 7}`, T.b),
    claw,
    flip(claw, x),
    r(x - 5, y - 4, 10, 14, E.grey, 2),
    r(x - 4, y + 8, 8, 44, E.dark, 2),
    r(x - 5, y + 50, 10, 6, E.grey, 2),
  );
};
const emLeg = () =>
  G(
    r(62, 142, 32, 44, E.white, 4),
    r(62, 152, 32, 8, E.red, 1),
    c(58, 172, 11, E.dark),
    c(58, 172, 4.5, E.grey, OUT, 1.5),
    r(54, 186, 46, 18, E.red, 5),
  );
const emHead = () =>
  g(
    { "data-emblus-face": "one-eye" },
    r(83, 38, 34, 30, E.white, 8),
    r(83, 38, 34, 9, E.red, 4),
    r(95, 28, 10, 10, E.light, 2),
    r(87, 47, 26, 16, E.dark, 4),
    r(90, 52, 7, 6, E.eye, 1.5, OUT, 1),
    c(107, 55, 10, E.green, OUT, 3),
    l("M102 51 Q106 47 111 50", "#d6ffe6", 2),
  );
const emArms = () =>
  mirror(
    G(
      r(16, 58, 42, 38, E.red, 6),
      r(24, 50, 26, 8, E.light, 2),
      r(22, 64, 30, 6, E.white, 1, OUT, 1.5),
      r(26, 96, 22, 50, E.white, 5),
      c(37, 120, 5, E.grey, OUT, 1.5),
    ),
  );
const emTorso = (chest: ReactNode) =>
  G(
    p("M52 72 H148 L140 146 H60 Z", E.white),
    p("M68 80 H132 L126 104 H74 Z", E.glass),
    l("M100 80 V104", OUT, 2),
    r(56, 110, 88, 8, E.red, 1),
    chest,
  );
const heldAt = (kids: ReactNode) => g({ transform: "rotate(24 163 152)" }, kids);
function emblusBody(grade: number) {
  return G(
    shadow(100, 210, 70),
    g({ className: "hj-mech-leg left" }, emLeg()),
    g({ className: "hj-mech-leg right" }, flip(emLeg())),
    emTorso(plus(100, 130, 11, E.green)),
    gradeMark(grade, 62, 120, 76),
    emArms(),
    g({ className: "hj-roster-weapon", "data-weapon-part": "clamp" }, heldAt(clamp())),
    c(37, 152, 11, E.grey),
    c(163, 152, 11, E.grey),
    emHead(),
  );
}
const ambulanceBody = () =>
  G(
    g({ transform: "translate(0 0)" }),
    <ellipse key="s" cx="130" cy="136" rx="112" ry="6" fill="#355e6426" />,
    p("M20 112 L20 76 L48 44 H84 V112 Z", E.white),
    p("M28 76 L50 52 H74 V76 Z", E.glass),
    r(84, 30, 152, 82, E.white, 6),
    r(20, 94, 216, 10, E.red, 0, OUT, 2),
    r(104, 42, 44, 34, E.glass, 3),
    plus(190, 60, 17, E.green),
    r(60, 34, 30, 10, E.light, 2),
    r(22, 102, 12, 8, E.light, 2),
    c(62, 118, 18, E.dark),
    c(62, 118, 7, E.grey, OUT, 2),
    c(196, 118, 18, E.dark),
    c(196, 118, 7, E.grey, OUT, 2),
  );
const emblusChanging = () =>
  G(
    <ellipse key="s" cx="100" cy="194" rx="82" ry="6" fill="#355e6426" />,
    r(44, 118, 34, 70, E.white, 4),
    r(122, 118, 34, 70, E.white, 4),
    r(44, 134, 34, 8, E.red, 1),
    r(122, 134, 34, 8, E.red, 1),
    c(44, 172, 14, E.dark),
    c(156, 172, 14, E.dark),
    c(44, 172, 5, E.grey, OUT, 1.5),
    c(156, 172, 5, E.grey, OUT, 1.5),
    p("M46 60 H154 L148 126 H52 Z", E.white),
    p("M64 70 H136 L130 96 H70 Z", E.glass),
    r(50, 102, 100, 8, E.red, 1),
    p("M46 60 L14 36 L8 84 L46 96 Z", E.red),
    p("M154 60 L186 36 L192 84 L154 96 Z", E.red),
    r(84, 42, 32, 18, E.white, 6),
    r(88, 46, 24, 12, E.dark, 3),
    c(106, 52, 7, E.green, OUT, 2),
  );

// ── The four featured robots that were already in the game ──
const ARMS_JOINT = "#39424d";
function policeBody(grade: number) {
  const A = "#4f7fd1",
    C = "#f2f6ff";
  const leg = G(
    r(68, 138, 26, 46, A, 4),
    r(68, 150, 26, 8, C, 1),
    c(81, 172, 5, ARMS_JOINT, OUT, 1.5),
    r(62, 184, 36, 18, ARMS_JOINT, 5),
  );
  return G(
    shadow(100, 208, 60),
    g({ className: "hj-mech-leg left" }, leg),
    g({ className: "hj-mech-leg right" }, flip(leg)),
    p("M60 70 H140 L132 140 H68 Z", A),
    p("M72 80 H128 L122 118 H78 Z", C),
    star(100, 99, 1.5, "#f7c948"),
    r(86, 122, 28, 12, ARMS_JOINT, 2),
    r(92, 125, 16, 6, "#f7c948", 1, OUT, 1),
    gradeMark(grade, 70, 134, 60),
    mirror(G(r(16, 58, 50, 34, "#3a66bb", 8), r(24, 66, 34, 8, C, 2))),
    r(28, 92, 22, 48, A, 5),
    r(150, 92, 22, 48, A, 5),
    r(12, 102, 18, 48, "#c8d8f5", 4),
    l("M16 112 H26 M16 126 H26", "#2f5aa8", 2),
    r(150, 128, 22, 14, "#f7c948", 3),
    c(161, 150, 9, ARMS_JOINT),
    c(39, 148, 9, ARMS_JOINT),
    g(
      { className: "hj-roster-weapon", "data-weapon-part": "sword" },
      r(157, 62, 8, 84, "#bff3ff", 4, "#2f8fd8", 2),
      r(150, 140, 22, 6, "#f5c542", 2),
    ),
    r(76, 34, 48, 36, C, 8),
    r(76, 34, 48, 10, A, 4),
    r(82, 46, 36, 16, "#1f2a33", 4),
    lamp(87, 51, 9, 6, "#9ef3ff"),
    lamp(104, 51, 9, 6, "#9ef3ff"),
    r(90, 22, 10, 12, "#e0443e", 2, OUT, 1.5),
    r(100, 22, 10, 12, "#4f9cf0", 2, OUT, 1.5),
  );
}
function fireBody(grade: number) {
  const A = "#e05a4f",
    C = "#ffe7a8",
    J = "#3d4650";
  const leg = G(
    r(62, 136, 32, 48, A, 4),
    r(62, 148, 32, 8, "#ffe45c", 0, OUT, 1.5),
    r(56, 184, 42, 18, J, 5),
  );
  return G(
    shadow(100, 208, 68),
    r(142, 26, 14, 110, "#ffd36b", 3, "#a5682d"),
    l("M142 48 H156 M142 72 H156 M142 96 H156 M142 120 H156", "#a5682d"),
    g({ className: "hj-mech-leg left" }, leg),
    g({ className: "hj-mech-leg right" }, flip(leg)),
    p("M52 68 H148 L140 142 H60 Z", A),
    r(66, 78, 68, 42, C, 5),
    c(100, 99, 13, A),
    l("M100 92 V106 M93 99 H107", "#fff", 3),
    r(54, 124, 92, 8, "#ffe45c", 0, OUT, 1.5),
    gradeMark(grade, 62, 134, 76),
    mirror(G(r(22, 60, 38, 32, "#c44739", 8), r(26, 92, 24, 46, A, 5))),
    p("M4 92 L46 88 L52 136 L28 164 L8 138 Z", "#e8edf0"),
    p("M14 100 L40 98 L44 132 L28 150 L14 132 Z", "#f08a2c"),
    c(162, 144, 9, J),
    g(
      { className: "hj-roster-weapon", "data-weapon-part": "cannon" },
      r(154, 134, 44, 16, "#a9b4bf", 4),
      r(192, 131, 8, 22, J, 2),
    ),
    r(74, 32, 52, 36, A, 6),
    p("M66 36 H134 L140 46 H60 Z", "#ffd36b"),
    r(82, 48, 36, 14, "#1f2a33", 4),
    lamp(87, 52, 9, 6, C),
    lamp(104, 52, 9, 6, C),
  );
}
function skyBody(grade: number) {
  const A = "#46a99a",
    B = "#2d7a6e",
    C = "#e8fff9",
    K = "#16323a",
    J = "#35505a";
  const leg = G(
    r(82, 134, 16, 50, A, 4),
    c(90, 158, 5, J),
    p("M74 202 L80 186 H100 L100 202 Z", J),
  );
  return G(
    shadow(100, 208, 46),
    mirror(
      G(
        p("M78 78 L4 38 L14 96 L74 114 Z", C),
        l("M24 54 L28 94 M44 64 L46 102 M60 74 L60 106", A),
        r(46, 114, 10, 14, J, 2),
        p("M46 128 h10 l3 8 h-16 Z", "#9ef3ff", OUT, 1.5),
      ),
    ),
    g({ className: "hj-mech-leg left" }, leg),
    g({ className: "hj-mech-leg right" }, flip(leg)),
    p("M78 70 H122 L116 134 H84 Z", A),
    p("M86 78 H114 L100 104 Z", K),
    c(100, 118, 6, "#9ef3ff"),
    gradeMark(grade, 84, 126, 32),
    mirror(G(r(62, 74, 16, 18, B, 5), r(64, 92, 12, 42, A, 4), c(70, 140, 7, J))),
    g(
      { className: "hj-roster-weapon", "data-weapon-part": "boomerang" },
      g(
        { transform: "translate(130 150)" },
        p(
          "M0-18 q10 10 0 18 q-10 10 -18 0 q10 -10 18 -18 Z M0 0 q18 4 14 16 q-12 0 -14 -16 Z",
          C,
          B,
        ),
      ),
    ),
    p("M84 66 L78 44 L100 30 L122 44 L116 66 Z", A),
    p("M86 46 H114 L108 58 H92 Z", K),
    lamp(91, 49, 6, 5, "#9ef3ff"),
    lamp(103, 49, 6, 5, "#9ef3ff"),
    p("M100 8 L106 32 H94 Z", C),
  );
}
function thunderPoliceBody(grade: number) {
  const A = "#3d5fb8",
    B = "#27407f",
    K = "#14213f",
    Y = "#ffe45c";
  const leg = G(
    r(72, 140, 18, 44, A, 3),
    l("M81 146 L77 160 L84 164 L80 180", Y),
    c(81, 138, 5, Y, OUT, 1.5),
    p("M62 202 L66 186 H92 L96 202 Z", B),
  );
  return G(
    shadow(100, 208, 54),
    g({ className: "hj-mech-leg left" }, leg),
    g({ className: "hj-mech-leg right" }, flip(leg)),
    p("M68 72 H132 L122 138 H78 Z", A),
    p("M80 82 H120 L114 114 H86 Z", K),
    bolt(100, 98, 0.95, Y),
    l("M76 126 H124", Y, 3),
    gradeMark(grade, 78, 130, 44),
    mirror(
      G(
        c(50, 74, 15, B),
        c(50, 74, 9, Y, OUT, 1.5),
        c(50, 74, 3.5, B, OUT, 0),
        l("M44 88 L38 110", A, 12),
        c(38, 114, 5, Y, OUT, 1.5),
        l("M38 116 L34 140", B, 10),
      ),
    ),
    p("M6 92 L34 96 L34 132 L18 160 L6 132 Z", Y),
    bolt(20, 120, 1, A),
    c(166, 146, 8, "#39424d"),
    g(
      { className: "hj-roster-weapon", "data-weapon-part": "bolt-sword" },
      p("M162 136 L156 46 L168 66 L164 66 L176 36 L172 140 Z", "#fff7b0", "#d8a500", 2),
      r(156, 136, 22, 6, Y, 2),
    ),
    p("M78 40 H122 L128 70 H72 Z", A),
    r(80, 50, 40, 12, K, 3),
    lamp(85, 53, 10, 6, Y),
    lamp(105, 53, 10, 6, Y),
    bolt(84, 26, 0.75, Y),
    bolt(116, 26, 0.75, Y),
  );
}

type Draw = (grade: number, weaponOut: boolean) => ReactNode;
const BODIES: Partial<Record<RobotSpeciesId, { draw: Draw; viewBox: string; side?: boolean }>> = {
  "rb-tira": { draw: tiraBody, viewBox: VB, side: true },
  "rb-emblus": { draw: emblusBody, viewBox: WIDE },
  "rb-police": { draw: policeBody, viewBox: VB },
  "rb-fire": { draw: fireBody, viewBox: VB },
  "rb-sky": { draw: skyBody, viewBox: VB },
  "rb-thunder-police": { draw: thunderPoliceBody, viewBox: VB },
};
const FORM_ART: Partial<Record<RobotForm, { draw: () => ReactNode; viewBox: string }>> = {
  egg: { draw: eggBody, viewBox: VB },
  ambulance: { draw: ambulanceBody, viewBox: "0 0 260 150" },
};

/** Tira is drawn from the side facing left; `facing` > 0 turns it round while it walks right. */
export function RobotRosterArt({
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
  id: RobotSpeciesId;
  grade?: number;
  moving?: boolean;
  weaponOut?: boolean;
  size?: number;
  label: string;
  form?: RobotForm;
  changing?: boolean;
  facing?: number;
}) {
  const body = BODIES[id]!;
  const formArt = form === "robot" ? undefined : FORM_ART[form];
  const changeArt = !changing
    ? undefined
    : id === "rb-tira"
      ? { draw: eggOpening, viewBox: VB }
      : id === "rb-emblus"
        ? { draw: emblusChanging, viewBox: "0 0 200 200" }
        : undefined;
  const art = changeArt ?? formArt;
  const viewBox = art?.viewBox ?? body.viewBox;
  const [, , vw, vh] = viewBox.split(" ").map(Number) as [number, number, number, number];
  const height = size * 1.25;
  const turns = (body.side || form === "ambulance") && facing > 0;
  return (
    <svg
      className={`hj-mech hj-roster${moving ? " moving" : ""}${weaponOut ? " weapon-out" : ""}${changing ? " changing" : ""}`}
      viewBox={viewBox}
      width={(height * vw) / vh}
      height={height}
      role="img"
      aria-label={label}
      data-roster={id}
      data-form={form}
      data-facing={turns ? "right" : "left"}
      data-weapon={weaponOut ? "drawn" : "stowed"}
      style={turns ? { transform: "scaleX(-1)" } : undefined}
    >
      {art ? art.draw() : body.draw(grade, weaponOut)}
    </svg>
  );
}

/** Emblus + Tira as one body. Tira's head is the chest; its tail, hands and feet are the sword. */
export function SpecialFusionArt({
  grades,
  weaponOut,
  moving,
  size,
  label,
  phase,
}: {
  grades: number[];
  weaponOut: boolean;
  moving: boolean;
  size: number;
  label: string;
  phase: string;
}) {
  return (
    <svg
      className={`hj-fused hj-roster stage-2 phase-${phase}${moving ? " moving" : ""}${weaponOut ? " weapon-out" : ""}`}
      viewBox={WIDE}
      width={size}
      height={(size * 222) / 250}
      role="img"
      aria-label={label}
      data-fusion="2"
      data-fusion-kind="special"
      data-fusion-phase={phase}
      data-part-body="rb-emblus"
      data-part-chest="rb-tira"
      data-part-weapon="rb-tira"
      data-weapon={weaponOut ? "drawn" : "stowed"}
    >
      {shadow(100, 210, 70)}
      <g className="hj-fbody">
        <g className="hj-fpart hj-fpart-legs">
          <g className="hj-fleg hj-fleg-l">{emLeg()}</g>
          <g className="hj-fleg hj-fleg-r">{flip(emLeg())}</g>
        </g>
        <g className="hj-fpart hj-fpart-torso">
          {emTorso(null)}
          {gradeMark(Math.max(grades[0] ?? 0, grades[1] ?? 0), 62, 122, 76)}
          {emArms()}
          {c(37, 152, 11, E.grey)}
          {emHead()}
        </g>
        <g className="hj-fpart hj-fpart-head" data-special-part="tira-chest">
          {r(64, 74, 72, 40, E.grey, 4)}
          {at(20, 41, 0.8, tiraFace())}
        </g>
        <g className="hj-fpart hj-fpart-arms">
          <g className="hj-farm hj-farm-r" data-special-part="antidote-sword">
            <g className="hj-roster-weapon">{heldAt(antidoteSword())}</g>
            {c(163, 152, 11, E.grey)}
          </g>
        </g>
      </g>
      {phase === "assembling" && (
        <circle className="hj-fflash" cx="100" cy="120" r="110" fill="#fffbe0" />
      )}
    </svg>
  );
}
