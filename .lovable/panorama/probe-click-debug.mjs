import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("console", (msg) => console.log("[console]", msg.type(), msg.text()));

await page.goto("http://localhost:8082/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("mockUser", JSON.stringify({ name: "Test", avatar: "sand" }));
  localStorage.setItem("configuratorReady", "true");
  localStorage.setItem("seenHotspotHint", "true");
});
await page.goto("http://localhost:8082/configurator", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
await page.getByLabel("Section s5").click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Explore more" }).click();
await page.waitForTimeout(2000);

// Real mouse click at the marker's actual screen coordinates.
const rect = await page.evaluate(() => {
  const el = document.querySelector(".psv-marker");
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log("clicking at", rect);
await page.mouse.click(rect.x, rect.y);
await page.waitForTimeout(1500);

const idAfter = await page.evaluate(() => document.querySelector(".psv-marker")?.id);
console.log("marker id after real mouse click:", idAfter);

await browser.close();
