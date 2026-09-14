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

await page.locator(".psv-marker").first().click({ force: true });
console.log("clicked to-livingroom, waiting...");

for (const t of [200, 500, 1000, 2000, 3000]) {
  await page.waitForTimeout(t === 200 ? 200 : 300);
  const info = await page.evaluate(() => {
    const el = document.querySelector(".psv-marker");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { id: el.id, className: el.className, display: cs.display };
  });
  console.log("t=", t, JSON.stringify(info));
}

await browser.close();
