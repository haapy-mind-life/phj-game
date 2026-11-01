#!/usr/bin/env node
// Checks that every relative link and image in tracked Markdown files points at a file that exists.
// Usage: node scripts/check-doc-links.mjs   (exit 1 when a link is broken)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const files = execFileSync("git", ["ls-files", "-z", "--", "*.md"], { encoding: "utf8" })
  .split("\0")
  .filter((f) => f && existsSync(f));

const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const broken = [];
let checked = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1];
    if (/^([a-z]+:|#|<)/i.test(target)) continue;
    const path = decodeURIComponent(target.split("#")[0]);
    if (!path) continue;
    checked += 1;
    const resolved = normalize(join(dirname(file), path));
    if (!existsSync(resolved)) broken.push(`${file}: ${target}`);
  }
}

console.log(`checked ${checked} links in ${files.length} markdown files`);
if (broken.length) {
  console.log(`${broken.length} broken:`);
  for (const line of broken) console.log(`  ${line}`);
  process.exit(1);
}
