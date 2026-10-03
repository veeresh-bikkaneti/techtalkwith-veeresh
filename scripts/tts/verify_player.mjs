/**
 * Headless check for Listen Mode.
 * Neural: highlight advances with audio.currentTime, seek and rate stay tied to it.
 * Missing recording: the speech API is not used, and Listen stays disabled.
 *
 *   node scripts/tts/verify_player.mjs
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../..", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".opus": "audio/ogg",
};

function serve(base) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const path = normalize(join(base, decodeURIComponent(url.pathname)));
    if (!path.startsWith(base)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(path);
      res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("missing");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function pageHtml(slug) {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<link rel="stylesheet" href="/assets/css/listen.css">
<style>body{margin:0 0 0 4rem}</style>
</head><body>
<article class="post">
  <h1 class="post-title">A short listen test</h1>
  <section class="listen" data-listen data-slug="${slug}" data-base="/scripts/tts/fixtures" aria-label="Listen to this article">
    <div class="listen-bar">
      <button type="button" class="listen-play" data-listen-play aria-pressed="false">
        <i class="fas fa-headphones listen-icon" data-listen-icon aria-hidden="true"></i>
        <span data-listen-label>Listen</span>
      </button>
      <div class="listen-group" role="group" aria-label="Voice">
        <button type="button" data-accent="auto" aria-pressed="true">Auto</button>
        <button type="button" data-accent="us" aria-pressed="false">US</button>
        <button type="button" data-accent="uk" aria-pressed="false">UK</button>
      </div>
      <label class="listen-seek"><span class="sr-only">Position</span>
        <input type="range" data-listen-seek min="0" max="1000" value="0" step="1" disabled>
      </label>
      <span class="listen-time" data-listen-time>0:00</span>
      <div class="listen-group" role="group" aria-label="Speed">
        <button type="button" data-rate="0.9">0.9×</button>
        <button type="button" data-rate="1" aria-pressed="true">1×</button>
        <button type="button" data-rate="1.25">1.25×</button>
        <button type="button" data-rate="1.5">1.5×</button>
      </div>
    </div>
    <p class="listen-note" data-listen-note></p>
    <p class="sr-only" data-listen-live aria-live="polite"></p>
    <button type="button" class="listen-float" data-listen-float hidden>
      <i class="fas fa-pause" aria-hidden="true"></i>
      <span class="sr-only" data-listen-float-label>Pause</span>
    </button>
  </section>
  <div class="post-content">
    <p>Speed stays near 1. The cost is about 0 dollars.</p>
    <ul><li>First item wraps onto the next line.</li></ul>
  </div>
</article>
<script src="/assets/js/listen.js" defer></script>
</body></html>`;
}

const server = await serve(root);
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
const failures = [];

function check(name, ok, detail) {
  console.log(`${ok ? "ok" : "FAIL"} ${name}${detail ? " " + detail : ""}`);
  if (!ok) failures.push(name);
}

try {
  const neural = await browser.newPage();
  await neural.route("**/listen-fixture.html", (route) =>
    route.fulfill({ contentType: "text/html", body: pageHtml("listen-fixture") })
  );
  await neural.goto(`http://127.0.0.1:${port}/listen-fixture.html`, { waitUntil: "domcontentloaded" });
  await neural.waitForFunction(() => document.querySelector("[data-listen]")?.dataset.bound === "1");
  await neural.click("[data-listen-play]");
  await neural.waitForFunction(() => document.querySelector("[data-listen]")?.dataset.mode === "neural", null, { timeout: 15000 });
  await neural.waitForFunction(() => {
    const audio = document.querySelector("audio") || [...document.querySelectorAll("*")].find(() => false);
    return document.querySelector("[data-listen]").dataset.state === "playing";
  });
  const moved = await neural.waitForFunction(() => {
    const current = document.querySelector(".listen-w.is-current");
    const audio = document.querySelector("audio");
    return current && audio && audio.currentTime > 0.15;
  }, null, { timeout: 10000 }).then(() => true).catch(() => false);
  check("highlight tracks the clock", moved);

  await neural.evaluate(() => {
    const audio = document.querySelector("audio");
    const seek = document.querySelector("[data-listen-seek]");
    seek.disabled = false;
    seek.value = "850";
    seek.dispatchEvent(new Event("input", { bubbles: true }));
    return audio.currentTime;
  });
  const afterSeek = await neural.evaluate(() => {
    const audio = document.querySelector("audio");
    const word = document.querySelector(".listen-w.is-current, li.is-current, p.is-current");
    return { time: audio ? audio.currentTime : 0, word: word ? word.textContent.trim() : "" };
  });
  check("seek moves playback", afterSeek.time > 1, `t=${afterSeek.time.toFixed(2)} word=${afterSeek.word}`);

  await neural.click("[data-rate='1.5']");
  const rate = await neural.evaluate(() => document.querySelector("audio").playbackRate);
  check("speed sets playbackRate", rate === 1.5, String(rate));

  const floatAgrees = await neural.evaluate(() => {
    const root = document.querySelector("[data-listen]");
    const floatBtn = document.querySelector("[data-listen-float]");
    return root.dataset.state === "playing" && floatBtn.getAttribute("aria-pressed") === "true" && !floatBtn.hidden;
  });
  check("float matches playing", floatAgrees);

  await neural.click("[data-listen-float]");
  const paused = await neural.evaluate(() => document.querySelector("[data-listen]").dataset.state);
  check("float pauses", paused === "paused", paused);

  await neural.click("[data-listen-play]");
  const resumed = await neural.evaluate(() => document.querySelector("[data-listen]").dataset.state);
  check("main control resumes", resumed === "playing", resumed);

  await neural.click("[data-accent='uk']");
  const ukUsesUs = await neural.waitForFunction(() => {
    const note = document.querySelector("[data-listen-note]");
    const audio = document.querySelector("audio");
    return note && /US voice/.test(note.textContent) && audio && /\/us\//.test(audio.src);
  }, null, { timeout: 8000 }).then(() => true).catch(() => false);
  check("UK preference still plays the US recording", ukUsesUs);

  const here = await browser.newPage();
  await here.route("**/listen-fixture.html", (route) =>
    route.fulfill({ contentType: "text/html", body: pageHtml("listen-fixture") })
  );
  await here.goto(`http://127.0.0.1:${port}/listen-fixture.html`, { waitUntil: "domcontentloaded" });
  await here.waitForSelector(".listen-here", { state: "attached", timeout: 15000 });
  const markers = await here.locator(".listen-here").count();
  check("each aligned block gets a play-from-here marker", markers >= 2, String(markers));

  await here.locator("li .listen-here").click({ force: true });
  await here.waitForFunction(() => document.querySelector("[data-listen]").dataset.state === "playing", null, { timeout: 15000 });
  const fromItem = await here.evaluate(() => document.querySelector("audio").currentTime);
  check("marker before first play starts at that block", fromItem > 1, `t=${fromItem.toFixed(2)}`);

  await here.locator("p .listen-here").click({ force: true });
  const fromPara = await here.evaluate(() => document.querySelector("audio").currentTime);
  check("marker while playing jumps back", fromPara < fromItem, `t=${fromPara.toFixed(2)}`);

  await here.click("[data-listen-play]");
  await here.locator("li .listen-here").click({ force: true });
  const resumedHere = await here.evaluate(() => document.querySelector("[data-listen]").dataset.state);
  check("marker while paused resumes", resumedHere === "playing", resumedHere);

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    window.__listenSpoken = [];
    window.__listenTestSpeech = {
      cancel() {},
      pause() {},
      resume() {},
      getVoices() { return [{ name: "Google US English", lang: "en-US", localService: true }]; },
      speak(utterance) {
        window.__listenSpoken.push(utterance.text);
        if (utterance.onend) setTimeout(() => utterance.onend(), 20);
      },
      addEventListener() {},
    };
  });
  await fallback.route("**/missing-article.html", (route) =>
    route.fulfill({ contentType: "text/html", body: pageHtml("missing-article") })
  );
  await fallback.goto(`http://127.0.0.1:${port}/missing-article.html`, { waitUntil: "domcontentloaded" });
  await fallback.waitForFunction(() => {
    const note = document.querySelector("[data-listen-note]");
    return note && /not on the site yet/.test(note.textContent);
  }, null, { timeout: 8000 });
  const fallbackState = await fallback.evaluate(() => ({
    mode: document.querySelector("[data-listen]").dataset.mode,
    spoken: window.__listenSpoken.length,
    disabled: document.querySelector("[data-listen-play]").disabled,
    speech: typeof window.speechSynthesis !== "undefined" && window.__listenSpoken.length,
  }));
  check("missing recording does not use browser speech", fallbackState.mode === "neural" && fallbackState.spoken === 0 && fallbackState.disabled, JSON.stringify(fallbackState));

  await fallback.evaluate(() => {
    window.addEventListener("pagehide", () => { window.__pagehide = true; });
    window.dispatchEvent(new Event("pagehide"));
  });
  const stopped = await fallback.evaluate(() => document.querySelector("[data-listen]").dataset.state);
  check("pagehide stops playback", stopped === "stopped", stopped);
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.log(`player checks failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("player checks passed");
