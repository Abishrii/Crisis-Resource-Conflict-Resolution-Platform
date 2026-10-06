const assert = require("node:assert/strict");
const { readFileSync, existsSync, mkdirSync } = require("node:fs");
const { createServer } = require("node:http");
const { resolve, extname } = require("node:path");
const { chromium: playwright } = require("playwright-chromium");

// Use a packaged headless binary and shared libraries in minimal CI containers.
process.env.AWS_EXECUTION_ENV = `AWS_Lambda_nodejs${process.versions.node.split(".")[0]}.x`;
const chromium = require("@sparticuz/chromium");
const project = process.cwd();
const archive = readFileSync(resolve(project,"public/archive/index.html"),"utf8");
const controller = readFileSync(resolve(project,"src/archive-controller.ts"),"utf8");
const modulePage = archive.replace(/<script>[\s\S]*?<\/script>/, '<script type="module">import { initializeArchive } from "/archive-controller.js"; initializeArchive();</script>');
const server = createServer((request,response) => {
  const pathname = new URL(request.url,"http://localhost").pathname;
  if (pathname === "/" || pathname === "/archive/index.html") {
    response.writeHead(200,{ "Content-Type":"text/html; charset=utf-8" });
    response.end(pathname === "/" ? modulePage : archive);
    return;
  }
  if (pathname === "/archive-controller.js") {
    response.writeHead(200,{ "Content-Type":"application/javascript; charset=utf-8" });
    response.end(controller);
    return;
  }
  if (pathname === "/production") {
    response.writeHead(200,{ "Content-Type":"text/html; charset=utf-8" });
    response.end(readFileSync(resolve(project,"dist/index.html"),"utf8"));
    return;
  }
  const image = resolve(project,"public",`.${pathname}`);
  if (pathname.startsWith("/images/") && existsSync(image)) {
    response.writeHead(200,{ "Content-Type":extname(image) === ".png" ? "image/png" : "image/jpeg" });
    response.end(readFileSync(image));
    return;
  }
  response.writeHead(404); response.end();
});

(async () => {
  let browser;
  try {
    await new Promise((accept) => server.listen(0,"127.0.0.1",accept));
    const origin = `http://127.0.0.1:${server.address().port}`;
    mkdirSync(resolve(project,"artifacts"),{ recursive:true });
    browser = await playwright.launch({ executablePath:await chromium.executablePath(),args:chromium.args,headless:true });
    const page = await browser.newPage({ viewport:{ width:1440,height:900 } });
    page.setDefaultTimeout(8000);
    const testTime = new Date("2026-07-01T06:30:00Z");
    await page.clock.install({ time:testTime });
    await page.clock.pauseAt(new Date(testTime.getTime()+1000));
    const errors = [];
    page.on("pageerror",(error) => errors.push(error.message));
    await page.route("**/*",(route) => {
      const url = route.request().url();
      if (!url.startsWith(origin)) return route.abort();
      return route.continue();
    });
    const screenshotEntry = "/";
    for (const entry of ["/","/archive/index.html"]) {
      await page.goto(`${origin}${entry}`,{ waitUntil:"domcontentloaded" });
      await page.waitForFunction(() => window.__resqsyncReady === true);
      assert.equal(await page.locator("iframe,#splash,#enterArchive").count(),0);
      await page.clock.runFor(200);
      await page.locator("#intro.is-open").waitFor({ state:"visible" });
      if (entry === screenshotEntry) {
        await page.screenshot({ path:resolve(project,"artifacts/intro-desktop-restored.png") });
      }
      await page.locator("#skip").click();
      assert.equal(await page.locator("body.intro-active").count(),0);
      if (entry === screenshotEntry) {
        await page.clock.runFor(200);
        await page.screenshot({ path:resolve(project,"artifacts/home-sphere-gather.png") });
        const gatheredOrbit = await page.locator(".stage-glow").evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue("--orbit-size")));
        await page.clock.runFor(4200);
        await page.screenshot({ path:resolve(project,"artifacts/home-sphere-open.png") });
        const openOrbit = await page.locator(".stage-glow").evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue("--orbit-size")));
        assert.ok(openOrbit > gatheredOrbit + 100,`Sphere should gather and open visibly (${gatheredOrbit}px -> ${openOrbit}px).`);
        const homeGeometry = await page.evaluate(() => {
          const bio = document.querySelector(".bio").getBoundingClientRect();
          const headline = [".sphere-name",".sphere-words",".sphere-label"].map((selector) => document.querySelector(selector).getBoundingClientRect());
          const overlaps = (a,b) => a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          return { collisions:headline.filter((text) => overlaps(text,bio)).length,brandNote:getComputedStyle(document.querySelector(".brand-note")).display,boxShadow:getComputedStyle(document.querySelector(".bio")).boxShadow };
        });
        assert.equal(homeGeometry.collisions,0,"Corner copy should not overlap the centered product lockup.");
        assert.equal(homeGeometry.brandNote,"block","The India descriptor should remain visible.");
        assert.equal(homeGeometry.boxShadow,"none","Homepage context should stay editorial rather than a floating card.");
        assert.equal(await page.locator(".ticker").count(),0,"The floating ticker should be removed.");
        assert.equal(await page.locator("[data-finder-open]").count(),0,"The photo finder controls should be removed from the page.");
        // Role login flow: help seeker raises a request, crisis manager sees it.
        await page.locator("#authBtn").click();
        await page.locator("#login.is-open").waitFor({ state:"visible" });
        await page.screenshot({ path:resolve(project,"artifacts/login-desktop.png") });
        await page.locator(".role-card[data-role='seeker']").click();
        assert.equal(await page.locator("[data-role-title]").textContent(),"Help seeker");
        await page.locator("#raiseForm [name='name']").fill("Test Resident");
        await page.locator("#raiseForm [name='phone']").fill("+91 90000 00001");
        await page.locator("#raiseForm [name='address']").fill("1 Test Lane, Pune");
        await page.locator("#raiseForm [name='brief']").fill("Need evacuation assistance.");
        await page.locator("#raiseForm [name='adults']").fill("2");
        await page.locator("#raiseForm [name='children']").fill("1");
        await page.locator("#raiseForm button[type='submit']").click();
        assert.equal(await page.locator("#roleTabs .is-active").textContent(),"Track my requests");
        assert.ok(await page.locator(".tracker li.done, .tracker li.now").count() >= 1,"Raised request should show tracker progress.");
        await page.screenshot({ path:resolve(project,"artifacts/workspace-seeker.png") });
        await page.locator("[data-close-panel]").click();
        await page.locator("#authBtn").click();
        await page.locator("#authBtn").click();
        await page.locator("#login.is-open").waitFor({ state:"visible" });
        await page.locator(".role-card[data-role='manager']").click();
        assert.equal(await page.locator("[data-role-title]").textContent(),"Crisis manager");
        assert.ok(await page.locator("#roleWorkspace .req-card").count() >= 1,"Manager queue should include the seeker's request.");
        await page.screenshot({ path:resolve(project,"artifacts/workspace-manager.png") });
        await page.locator("[data-close-panel]").click();
        assert.equal(await page.locator("body.panelopen").count(),0);
        console.log(`[archive-browser] PASS home + role workspaces: seeker raised a request, manager queue received it.`);
      }
      await page.locator("#menuBtn").click();
      await page.locator("#menu [data-watch-intro]").click();
      await page.locator("#intro.is-open").waitFor({ state:"visible" });
      if (entry === screenshotEntry) {
        await page.clock.runFor(3200);
        await page.locator("#intro").waitFor({ state:"hidden",timeout:3000 });
        assert.equal(await page.locator("body.intro-active").count(),0,"Blocked film should hand off to the archive.");
      } else await page.locator("[data-intro-workspace]").click();
      assert.equal(await page.locator("body.intro-active").count(),0);
      if (await page.locator("body.panelopen").count()) await page.locator("[data-close-panel]").click();
      if ((await page.locator("#authBtn").textContent()) !== "Login") await page.locator("#authBtn").click();
      await page.locator("#menuBtn").click();
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("body.menu-open").count(),0);
      console.log(`[archive-browser] PASS desktop ${entry}: intro, login gate, role workspaces, replay, theme and Escape.`);
      await page.locator("header [data-theme-toggle]").click();
    }

    await page.setViewportSize({ width:390,height:844 });
    await page.goto(`${origin}${screenshotEntry}`,{ waitUntil:"domcontentloaded" });
    await page.waitForFunction(() => window.__resqsyncReady === true);
    await page.locator("#intro.is-open").waitFor({ state:"visible" });
    await page.screenshot({ path:resolve(project,"artifacts/intro-mobile-restored.png") });
    await page.locator("#skip").click();
    await page.clock.runFor(600);
    await page.locator("#intro").waitFor({ state:"hidden" });
    await page.screenshot({ path:resolve(project,"artifacts/home-mobile-composed.png") });
    const mobileComposition = await page.evaluate(() => {
      const bio = document.querySelector(".bio").getBoundingClientRect();
      const headline = [".sphere-name",".sphere-words",".sphere-label"].map((selector) => document.querySelector(selector).getBoundingClientRect());
      const overlaps = (a,b) => a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const brand = document.querySelector(".brand-lockup").getBoundingClientRect();
      const actions = document.querySelector(".header-actions").getBoundingClientRect();
      return { titleCollision:headline.some((rect) => overlaps(rect,bio)),headerCollision:brand.right > actions.left };
    });
    assert.equal(mobileComposition.titleCollision,false,"The homepage mission panel overlaps the centered title on mobile.");
    assert.equal(mobileComposition.headerCollision,false,"The header brand and navigation controls overlap on mobile.");
    await page.locator("header [data-theme-toggle]").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"),"light");
    await page.locator("header [data-theme-toggle]").click();
    await page.locator("#menuBtn").click();
    await page.locator("#menu [data-panel='crises']").click();
    await page.locator("#login.is-open").waitFor({ state:"visible" });
    await page.locator(".role-card[data-role='coordinator']").click();
    assert.equal(await page.locator("[data-role-title]").textContent(),"Resource coordinator");
    await page.locator("#roleTabs [data-role-tab='1']").click();
    assert.equal(await page.locator("#roleTabs .is-active").textContent(),"Inventory");
    await page.screenshot({ path:resolve(project,"artifacts/workspace-mobile.png") });
    await page.locator("[data-close-panel]").click();
    assert.equal(await page.locator("body.panelopen").count(),0);
    assert.equal(await page.locator("iframe,#splash,#enterArchive").count(),0);
    await page.goto(`${origin}${screenshotEntry}?skipIntro=1`,{ waitUntil:"domcontentloaded" });
    await page.waitForFunction(() => window.__resqsyncReady === true);
    assert.equal(await page.locator("body.intro-active").count(),0,"skipIntro URL should open the site directly.");
    await page.emulateMedia({ reducedMotion:"reduce" });
    await page.goto(`${origin}${screenshotEntry}`,{ waitUntil:"domcontentloaded" });
    await page.waitForFunction(() => window.__resqsyncReady === true);
    assert.equal(await page.locator("body.intro-active").count(),0,"Reduced motion should bypass autoplay.");
    await page.locator("#menuBtn").click();
    await page.locator("[data-watch-intro]").click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("body.intro-active").count(),0,"Escape should close a replayed intro.");
    assert.deepEqual(errors,[]);
    console.log("[archive-browser] PASS 390px mobile: intro, login gate, coordinator workspace, theme, recovery URL, reduced motion and Escape.");
  } finally {
    if (browser) await browser.close();
    await new Promise((accept) => server.close(accept));
  }
})().catch((error) => { console.error(error.stack); process.exitCode = 1; });