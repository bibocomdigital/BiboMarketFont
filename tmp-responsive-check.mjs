import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const widths = [390, 768, 1024, 1200, 1440];
const pages = ["/"];
const outDir = "/home/gorgui-marena/Documents/Projects/Private/Bibo/Market/MarketAll/BiboMarketFont/tmp-shots";
mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-debugging-port=9223",
    "--window-size=1440,900",
  ],
  { stdio: "ignore" },
);

async function cdp() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch("http://127.0.0.1:9223/json/version");
      if (res.ok) {
        const info = await res.json();
        return info.webSocketDebuggerUrl;
      }
    } catch {
      await sleep(150);
    }
  }
  throw new Error("Chrome DevTools indisponible");
}

const wsUrl = await cdp();
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});

function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(msgId, (msg) => {
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    });
    const payload = { id: msgId, method, params };
    if (sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 900,
  deviceScaleFactor: 1,
  mobile: true,
}, sessionId);

const report = [];

for (const page of pages) {
  for (const width of widths) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    }, sessionId);
    await send("Page.navigate", { url: `http://127.0.0.1:3006${page}` }, sessionId);
    await sleep(6000);
    const measured = await send("Runtime.evaluate", {
      expression: `(() => {
        const doc = document.documentElement;
        const asides = [...document.querySelectorAll("aside")];
        const hero = document.querySelector("[aria-roledescription=carrousel]");
        const grid = hero && hero.closest("main")?.querySelector(":scope > div");
        return {
          inner: window.innerWidth,
          scroll: doc.scrollWidth,
          overflow: doc.scrollWidth > window.innerWidth + 1,
          cols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
          asides: asides.map((el) => {
            const r = el.getBoundingClientRect();
            return { display: getComputedStyle(el).display, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
          }),
          heroH: hero ? Math.round(hero.getBoundingClientRect().height) : 0,
          arrows: document.querySelectorAll("[aria-label='Image suivante']").length,
          slides: document.querySelectorAll("[aria-roledescription=carrousel] img").length,
          headline: document.querySelector("h1")?.textContent?.slice(0, 40) || "",
        };
      })()`,
      returnByValue: true,
    }, sessionId);
    report.push({ page, width, ...measured.result.value });
    if (width === 390 || width === 768 || width === 1200 || width === 1440) {
      const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
      writeFileSync(`${outDir}/home-${width}.png`, Buffer.from(shot.data, "base64"));
    }
    if (width === 390) {
      const box = await send("Runtime.evaluate", {
        expression: `(() => { const b = document.querySelector("button[aria-label='Ouvrir le menu']"); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, n: document.querySelectorAll("button[aria-label='Ouvrir le menu']").length }; })()`,
        returnByValue: true,
      }, sessionId);
      const point = box.result.value;
      if (point) {
        await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 }, sessionId);
        await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 }, sessionId);
      }
      await sleep(500);
      const drawer = await send("Page.captureScreenshot", { format: "png" }, sessionId);
      writeFileSync(`${outDir}/home-390-drawer.png`, Buffer.from(drawer.data, "base64"));
      const drawerState = await send("Runtime.evaluate", {
        expression: `(() => {
          const panel = document.querySelector("[aria-label=\\"Menu de l'accueil\\"]");
          const r = panel?.getBoundingClientRect();
          return { open: !!document.querySelector("button[aria-label='Fermer le menu']"), w: r ? Math.round(r.width) : 0, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
        })()`,
        returnByValue: true,
      }, sessionId);
      report.push({ page, width, point, drawer: drawerState.result.value });
    }
  }
}

console.log(JSON.stringify(report, null, 2));
ws.close();
chrome.kill();
process.exit(0);
