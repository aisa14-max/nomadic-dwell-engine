import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

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

const info = await page.evaluate(() => {
  const el = document.querySelector(".psv-marker");
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    found: true,
    id: el.id,
    className: el.className,
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    transform: cs.transform,
    rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    outerHTML: el.outerHTML.slice(0, 500),
  };
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
