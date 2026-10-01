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
    const errors = [];
    page.on("pageerror",(error) => errors.push(error.message));
    await page.route("**/*",(route) => {
      const url = route.request().url();
      if (!url.startsWith(origin)) return route.abort();
      return route.continue();
    });
    for (const entry of ["/","/archive/index.html","/production"]) {
      await page.goto(`${origin}${entry}`,{ waitUntil:"domcontentloaded" });
      await page.waitForFunction(() => window.__resqsyncReady === true);
      assert.equal(await page.locator("iframe,#splash,#intro,#enterArchive").count(),0);
      await page.locator("#menuBtn").click();
      await page.locator("#menu [data-panel='overview']").click();
      for (const [id,title] of [["crises","Crises"],["resources","Resources"],["conflicts","Allocations"],["users","People & access"],["collaboration","Messages & files"],["analytics","Reports"],["decision","Scenario planning"]]) {
        await page.locator(`.workspace-sidebar [data-panel='${id}']`).click();
        assert.equal(await page.locator(".module-head h2").textContent(),title);
      }
      await page.locator(".ws-pager-btn").first().click();
      assert.equal(await page.locator(".module-head h2").textContent(),"Reports");
      await page.locator(".ws-steps [aria-label^='Next']").click();
      assert.equal(await page.locator(".module-head h2").textContent(),"Scenario planning");
      await page.locator(".ws-breadcrumb [data-panel='overview']").click();
      assert.equal(await page.locator(".module-head h2").textContent(),"Overview");
      if (entry === "/production") await page.screenshot({ path:resolve(project,"artifacts/workspace-desktop-dark.png") });
      await page.locator(".workspace-top [data-theme-toggle]").click();
      assert.equal(await page.locator("html").getAttribute("data-theme"),"light");
      if (entry === "/production") await page.screenshot({ path:resolve(project,"artifacts/workspace-desktop-light.png") });
      await page.locator(".ws-exit").click();
      assert.equal(await page.locator("body.panelopen").count(),0);
      await page.locator("#menuBtn").click();
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("body.menu-open").count(),0);
      console.log(`[archive-browser] PASS desktop ${entry}: immediate access, menu, seven modules, theme and Escape.`);
      await page.locator("header [data-theme-toggle]").click();
    }

    await page.setViewportSize({ width:390,height:844 });
    await page.goto(`${origin}/production`,{ waitUntil:"domcontentloaded" });
    await page.waitForFunction(() => window.__resqsyncReady === true);
    await page.locator("#menuBtn").click();
    await page.locator("#menu [data-panel='crises']").click();
    assert.equal(await page.locator(".module-head h2").textContent(),"Crises");
    await page.locator("[data-ws-drawer]").click();
    assert.equal(await page.locator("body.ws-drawer-open").count(),1);
    await page.waitForTimeout(400);
    await page.screenshot({ path:resolve(project,"artifacts/workspace-mobile-drawer.png") });
    await page.locator(".workspace-sidebar [data-panel='resources']").click();
    assert.equal(await page.locator(".module-head h2").textContent(),"Resources");
    assert.equal(await page.locator("body.ws-drawer-open").count(),0);
    await page.locator(".ws-pager-btn.next").click();
    assert.equal(await page.locator(".module-head h2").textContent(),"Allocations");
    await page.locator("[data-ws-drawer]").click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("body.ws-drawer-open").count(),0);
    await page.locator(".ws-breadcrumb").waitFor();
    await page.screenshot({ path:resolve(project,"artifacts/workspace-mobile.png") });
    await page.locator(".workspace-top [data-theme-toggle]").click();
    await page.locator(".ws-exit").click();
    assert.equal(await page.locator("body.panelopen").count(),0);
    assert.equal(await page.locator("iframe,#splash,#enterArchive").count(),0);
    assert.deepEqual(errors,[]);
    console.log("[archive-browser] PASS 390px mobile: startup, menu, crises, theme and close.");
  } finally {
    if (browser) await browser.close();
    await new Promise((accept) => server.close(accept));
  }
})().catch((error) => { console.error(error.stack); process.exitCode = 1; });