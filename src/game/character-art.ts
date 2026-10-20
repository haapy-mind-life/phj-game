import type { FamilyAppearanceId } from "./family-identity.ts";
import { OUTFITS } from "./world-content.ts";
import type { Outfit } from "../lib/world-model.ts";
export type CharacterMotion = "idle" | "walk" | "swim";
export function characterSvg(
  outfit: Outfit = "mint",
  motion: CharacterMotion = "idle",
  diving = false,
  reducedMotion = false,
  identity: FamilyAppearanceId = "hyunjun",
) {
  const accent = { hyunjun: "#71bfa7", dad: "#79aee0", mom: "#efac98", sister: "#b1a2d9" }[
    identity
  ];
  const c =
    (outfit === "mint" ? accent : null) ??
    OUTFITS.find((o) => o.id === outfit)?.color ??
    { mint: "#71bfa7", peach: "#efac98", lavender: "#b1a2d9" }[
      outfit as "mint" | "peach" | "lavender"
    ] ??
    "#71bfa7";
  const accessory: Record<string, string> = {
    sky: '<path d="M22 37Q25 7 62 13Q92 9 96 37Z" fill="#5d98c7"/><path d="M35 36h70" stroke="#f6d276" stroke-width="9" stroke-linecap="round"/>',
    strawberry:
      '<path d="m49 24 9-17 7 14 14-7-8 18" fill="#649b72"/><circle cx="37" cy="34" r="3" fill="#ffe5a0"/><circle cx="81" cy="31" r="3" fill="#ffe5a0"/>',
    explorer:
      '<path d="M30 33 38 10H82L91 33" fill="#d6b982"/><path d="M19 36h82" stroke="#896e4e" stroke-width="9" stroke-linecap="round"/>',
    pumpkin:
      '<path d="M56 24 61 8 70 10" stroke="#688b5f" stroke-width="7" fill="none"/><path d="m39 32 8-8 6 8m18 0 8-8 6 8" fill="#846444"/>',
    witch:
      '<path d="M22 37 59 1 93 37Z" fill="#71609e"/><path d="M16 37h88" stroke="#cdb1e5" stroke-width="8" stroke-linecap="round"/><path d="m60 15 2 5 6 1-5 3 2 6-5-3-5 3 1-6-4-3 6-1" fill="#f6d77a"/>',
    bat: '<path d="M33 91 5 74 9 113 22 105 30 119m57-28 28-17-4 39-13-8-8 14" fill="#777b9e" stroke="#535d86" stroke-width="3"/>',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" data-motion="${motion}" data-identity="${identity}">
<style>
.arm-left{transform-origin:37px 89px}.arm-right{transform-origin:83px 89px}
.leg-left{transform-origin:43px 113px}.leg-right{transform-origin:77px 113px}
${motion !== "idle" ? `.arm-left,.leg-right{animation:stride .55s ease-in-out infinite alternate}.arm-right,.leg-left{animation:stride .55s ease-in-out infinite alternate-reverse}.body{animation:bounce .55s ease-in-out infinite alternate}` : ""}
${motion === "swim" ? `.arm-left,.arm-right,.leg-left,.leg-right{animation-duration:.8s}.body{animation-duration:1s}` : ""}
.eyes{transform-origin:60px 61px;animation:blink 4.5s infinite}
@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.12)}}
@keyframes stride{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}
@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-3px)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
${reducedMotion ? "*{animation:none!important}" : ""}
</style>
<ellipse cx="60" cy="151" rx="32" ry="5" fill="#345b4826"/>
<g class="body">
<g class="leg-left" data-part="leg-left"><path d="M43 111v25" stroke="#526d8b" stroke-width="15" stroke-linecap="round"/><path d="M33 139h19" stroke="${diving ? "#f4c75f" : "#fffdf3"}" stroke-width="12" stroke-linecap="round"/></g>
<g class="leg-right" data-part="leg-right"><path d="M77 111v25" stroke="#526d8b" stroke-width="15" stroke-linecap="round"/><path d="M68 139h19" stroke="${diving ? "#f4c75f" : "#fffdf3"}" stroke-width="12" stroke-linecap="round"/></g>
${diving ? '<rect x="18" y="77" width="22" height="46" rx="9" fill="#f0c65c" stroke="#fff3c6" stroke-width="3"/>' : ""}
<g class="arm-left" data-part="arm-left"><path d="M37 89 25 111" stroke="${c}" stroke-width="15" stroke-linecap="round"/><circle cx="25" cy="114" r="7" fill="#ffddc1"/></g>
<g class="arm-right" data-part="arm-right"><path d="M83 89 95 111" stroke="${c}" stroke-width="15" stroke-linecap="round"/><circle cx="95" cy="114" r="7" fill="#ffddc1"/></g>
<rect x="34" y="79" width="52" height="43" rx="18" fill="${c}"/>
<path d="M49 93h22v20H49z" fill="#fff5da"/><path d="m60 94 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1" fill="#edba59"/>
<path d="M37 88h46" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
<g data-part="face">
${
  identity === "hyunjun"
    ? `
<ellipse cx="33" cy="22" rx="12" ry="20" fill="${c}" transform="rotate(-17 33 22)"/><ellipse cx="87" cy="22" rx="12" ry="20" fill="${c}" transform="rotate(17 87 22)"/>
<ellipse cx="33" cy="22" rx="5" ry="12" fill="#f9d7ce"/><ellipse cx="87" cy="22" rx="5" ry="12" fill="#f9d7ce"/>
`
    : ""
}
${identity === "sister" ? '<path d="M28 38Q-3 20 12 78L29 65M92 38Q123 20 108 78L91 65" fill="#554448"/><circle cx="17" cy="40" r="8" fill="#b1a2d9"/><circle cx="103" cy="40" r="8" fill="#b1a2d9"/>' : ""}
<rect x="14" y="25" width="92" height="72" rx="34" fill="${c}"/><rect x="23" y="36" width="74" height="54" rx="27" fill="#ffe3c9"/>
${identity === "dad" ? '<path d="M24 49Q25 26 60 30Q94 26 96 49L79 42 70 47 54 42 39 48Z" fill="#493d3d"/><path d="M36 52h16m17 0h16" stroke="#493d3d" stroke-width="4" stroke-linecap="round"/>' : identity === "mom" ? '<path d="M22 66Q13 27 60 29Q106 27 98 72L87 78 89 49Q69 46 61 38Q48 50 30 50L32 77Z" fill="#69483f"/>' : identity === "sister" ? '<path d="M24 51Q26 25 62 30Q94 30 96 51Q70 50 67 38Q54 54 24 51" fill="#554448"/>' : '<path d="M26 52q0-22 33-20 34-2 35 20-10-2-16-13-3 12-16 10l-4-8q-13 17-32 11" fill="#5d443f"/>'}
<g class="eyes" transform="${identity === "mom" ? "translate(0 3) scale(1 .95)" : ""}"><ellipse cx="44" cy="61" rx="4.7" ry="6.3" fill="#453f41"/><ellipse cx="77" cy="61" rx="4.7" ry="6.3" fill="#453f41"/>
<circle cx="45" cy="59" r="1.5" fill="white"/><circle cx="78" cy="59" r="1.5" fill="white"/></g>
${identity === "dad" ? '<g fill="none" stroke="#405b76" stroke-width="3"><rect x="31" y="52" width="26" height="21" rx="8"/><rect x="64" y="52" width="26" height="21" rx="8"/><path d="M57 60h7"/></g>' : identity === "sister" ? '<path d="m36 55-4-3m49 3 4-3" stroke="#554448" stroke-width="3"/>' : ""}
<ellipse cx="35" cy="72" rx="8" ry="4.5" fill="#f3ada6"/><ellipse cx="85" cy="72" rx="8" ry="4.5" fill="#f3ada6"/>
<path d="M54 76q6 8 13 0" fill="none" stroke="#a56560" stroke-width="2.7" stroke-linecap="round"/>
${diving ? '<g data-part="dive-mask"><path d="M23 58h74" stroke="#375f79" stroke-width="6"/><rect x="28" y="47" width="64" height="27" rx="12" fill="#8ee4ef" fill-opacity=".35" stroke="#fff4cb" stroke-width="5"/><path d="M96 64h10V28h-8" fill="none" stroke="#f2be55" stroke-width="7" stroke-linecap="round"/><path d="m36 53 14-1" stroke="white" stroke-width="3" stroke-linecap="round"/></g>' : ""}
</g>${accessory[outfit] ?? ""}</g></svg>`;
}
export const characterUrl = (
  outfit: Outfit = "mint",
  motion: CharacterMotion = "idle",
  diving = false,
  reducedMotion = false,
  identity: FamilyAppearanceId = "hyunjun",
) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(characterSvg(outfit, motion, diving, reducedMotion, identity))}`;
