import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

async function clickMarker(page, label) {
  const rect = await page.evaluate(() => {
    const el = document.querySelector(".psv-marker");
    if (!el) return null;
    const cs = getComputedStyle(el);
    if (cs.display === "none") return { hidden: true };
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, id: el.id };
  });
  console.log(label, "marker rect:", rect);
  if (!rect || rect.hidden) throw new Error(`${label}: marker not visible`);
  const before = rect.id;
  await page.mouse.click(rect.x, rect.y);
  // Poll for the marker id to actually change (real navigation confirmation).
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(300);
    const nowId = await page.evaluate(() => document.querySelector(".psv-marker")?.id);
    if (nowId !== before) {
      console.log(label, "-> switched to", nowId, "after", (i + 1) * 300, "ms");
      await page.waitForTimeout(1500);
      return nowId;
    }
  }
  throw new Error(`${label}: marker id never changed from ${before}`);
}

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
await page.screenshot({ path: ".lovable/panorama/t2-01-bedroom.png" });

await clickMarker(page, "bedroom->livingroom");
await page.screenshot({ path: ".lovable/panorama/t2-02-livingroom.png" });

await clickMarker(page, "livingroom->bedroom");
await page.screenshot({ path: ".lovable/panorama/t2-03-bedroom-again.png" });

console.log("ALL GOOD");
await browser.close();
