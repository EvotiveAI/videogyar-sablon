#!/usr/bin/env node
// TikTok hashtag-oldalak videói statisztikával, bejelentkezés nélkül (headless Chrome).
// A yt-dlp TikTok-hashtag része hibás, ezért az oldal saját item_list API-válaszait olvassuk ki
// görgetés közben. Csak olvas: nem kattint, nem lájkol, nem követ.
// Használat: node tools/viral/tiktok_tags.mjs aiwebsite,webdesign [--scrolls 12]
// Kimenet (stdout): egy JSON-sor videónként {id, url, author, followers, desc, views, likes, comments, shares, saves, created, duration, tag}
import { chromium } from "../recorder/node_modules/playwright-core/index.mjs";

const tags = (process.argv[2] || "").split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
const scrolls = Number(process.argv[process.argv.indexOf("--scrolls") + 1] || 12);
if (!tags.length) {
  console.error("Használat: node tools/viral/tiktok_tags.mjs tag1,tag2 [--scrolls 12]");
  process.exit(1);
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"], // enélkül a TikTok üres oldalt ad
});
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  locale: "en-US",
  viewport: { width: 1440, height: 900 },
});
const seen = new Set();

for (const tag of tags) {
  const page = await ctx.newPage();
  let got = 0;
  page.on("response", async (r) => {
    if (!r.url().includes("/api/challenge/item_list/")) return;
    try {
      const j = await r.json();
      for (const it of j.itemList || []) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        got++;
        const s = it.stats || {};
        const a = it.author || {};
        console.log(JSON.stringify({
          id: it.id,
          url: `https://www.tiktok.com/@${a.uniqueId}/video/${it.id}`,
          author: a.uniqueId,
          followers: it.authorStats?.followerCount ?? null,
          desc: Array.from((it.desc || "").replace(/\s+/g, " ")).slice(0, 200).join(""),
          views: s.playCount ?? null,
          likes: s.diggCount ?? null,
          comments: s.commentCount ?? null,
          shares: s.shareCount ?? null,
          saves: Number(s.collectCount ?? 0) || null,
          created: it.createTime,
          duration: it.video?.duration ?? null,
          tag,
        }));
      }
    } catch {}
  });
  try {
    await page.goto(`https://www.tiktok.com/tag/${encodeURIComponent(tag)}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(6000);
    for (let i = 0; i < scrolls; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.mouse.wheel(0, 1500);
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.error(`#${tag}: ${e.message.split("\n")[0]}`);
  }
  console.error(`TikTok #${tag}: ${got} videó`);
  await page.close();
}
await browser.close();
process.exit(0);
