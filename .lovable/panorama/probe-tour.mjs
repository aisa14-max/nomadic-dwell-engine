import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("console", (msg) => { if (msg.type() === "error") console.log("[console.error]", msg.text()); });

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
await page.waitForTimeout(1200);
await page.screenshot({ path: ".lovable/panorama/tour-01-bedroom.png" });

const markerCount = await page.locator(".psv-marker").count();
console.log("marker count in bedroom scene:", markerCount);

// Click the spotlight marker to jump to the living room.
await page.locator(".psv-marker").first().click({ force: true });
await page.waitForTimeout(2000);
await page.screenshot({ path: ".lovable/panorama/tour-02-livingroom.png" });

const markerCount2 = await page.locator(".psv-marker").count();
console.log("marker count in livingroom scene:", markerCount2);
const markerId2 = await page.locator(".psv-marker").first().getAttribute("id");
console.log("marker id in livingroom scene:", markerId2);

// Click back to bedroom.
await page.locator(".psv-marker").first().click({ force: true });
await page.waitForTimeout(2000);
await page.screenshot({ path: ".lovable/panorama/tour-03-back-to-bedroom.png" });

const markerId3 = await page.locator(".psv-marker").first().getAttribute("id");
console.log("marker id after returning to bedroom:", markerId3);

await browser.close();
console.log("done");
