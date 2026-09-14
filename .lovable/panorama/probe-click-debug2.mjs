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

const rect = await page.evaluate(() => {
  const el = document.querySelector(".psv-marker");
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});

const whatIsThere = await page.evaluate(({ x, y }) => {
  const el = document.elementFromPoint(x, y);
  return el ? { tag: el.tagName, cls: el.className, id: el.id } : null;
}, rect);
console.log("elementFromPoint at marker center:", whatIsThere);

// Attach a native click listener directly on the marker to confirm the DOM click fires at all.
await page.evaluate(() => {
  const el = document.querySelector(".psv-marker");
  el.addEventListener("click", () => { window.__markerClicked = (window.__markerClicked || 0) + 1; }, true);
});
await page.mouse.click(rect.x, rect.y);
await page.waitForTimeout(300);
const clicked = await page.evaluate(() => window.__markerClicked);
console.log("native click listener fired:", clicked);

await browser.close();
