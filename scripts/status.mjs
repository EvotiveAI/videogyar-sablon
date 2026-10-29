#!/usr/bin/env node
// Áttekintés: melyik videó milyen állapotban van. Használat: node scripts/status.mjs [status]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ORDER = [
  "concept_ready", "awaiting_footage", "ready_to_post", "failed",
  "approved", "in_production", "researching", "idea",
  "posted", "measured", "rejected",
];
const HUMAN = new Set(["concept_ready", "awaiting_footage", "ready_to_post", "failed"]);

const root = join(import.meta.dirname, "..", "content");
const filter = process.argv[2];

const parse = (text) =>
  Object.fromEntries(
    text.split("\n")
      .map((l) => l.match(/^(\w+):\s*(.*?)\s*(#.*)?$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
  );

const videos = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => join(root, d.name, "meta.yaml"))
  .filter(existsSync)
  .map((p) => parse(readFileSync(p, "utf8")));

const groups = Object.groupBy(videos, (v) => v.status || "unknown");
const statuses = [...ORDER, ...Object.keys(groups).filter((s) => !ORDER.includes(s))];

let printed = 0;
for (const s of statuses) {
  if (!groups[s] || (filter && s !== filter)) continue;
  console.log(`\n${HUMAN.has(s) ? "👉 " : "   "}${s} (${groups[s].length})`);
  for (const v of groups[s]) {
    const extra = [v.format, v.stage, v.notes && s === "failed" ? v.notes : ""].filter(Boolean).join(" · ");
    console.log(`     ${v.id}  ${v.title}${extra ? `  [${extra}]` : ""}`);
  }
  printed++;
}
if (!printed) console.log("Nincs videó" + (filter ? ` "${filter}" állapotban.` : ". Indíts egy /ideas futást."));
console.log("\n👉 = rád vár");
