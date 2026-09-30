import { spawn } from "node:child_process";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
const chrome = spawn("google-chrome", ["--headless=new","--disable-gpu","--no-sandbox","--disable-dev-shm-usage","--remote-debugging-port=9224","--window-size=390,900"], { stdio: "ignore" });
for (let i = 0; i < 40; i++) {
  try { const res = await fetch("http://127.0.0.1:9224/json/version"); if (res.ok) break; } catch { await sleep(150); }
}
const info = await (await fetch("http://127.0.0.1:9224/json/version")).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const logs = [];
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Runtime.exceptionThrown") logs.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === "Runtime.consoleAPICalled") logs.push(msg.params.args.map((a) => a.value || a.description).join(" "));
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
await new Promise((resolve) => ws.addEventListener("open", resolve));
function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(msgId, (msg) => msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result));
    const payload = { id: msgId, method, params };
    if (sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
  });
}
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: true }, sessionId);
await send("Page.navigate", { url: "http://127.0.0.1:3006/" }, sessionId);
await sleep(8000);
const before = await send("Runtime.evaluate", {
  expression: `(() => {
    const b = document.querySelector("button[aria-label='Ouvrir le menu']");
    const r = b.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.x + r.width/2, r.y + r.height/2).slice(0, 5).map((el) => el.tagName + "." + (el.className || "").toString().slice(0, 60));
    let found = 0;
    for (const el of document.querySelectorAll("*")) {
      if (Object.getOwnPropertyNames(el).some((k) => k.toLowerCase().includes("react"))) found += 1;
    }
    const scripts = performance.getEntriesByType("resource").filter((e) => e.name.includes(".js")).map((e) => e.name.split("/").pop()).slice(0, 12);
    return { found, scripts, expanded: b.getAttribute("aria-expanded") };
  })()`,
  returnByValue: true,
}, sessionId);
await sleep(300);
const after = await send("Runtime.evaluate", {
  expression: `({ close: !!document.querySelector("button[aria-label='Fermer le menu']"), text: document.body.innerText.includes("Proposer une livraison") })`,
  returnByValue: true,
}, sessionId);
console.log(JSON.stringify({ before: before.result.value, after: after.result.value, logs }, null, 2));
ws.close(); chrome.kill(); process.exit(0);
