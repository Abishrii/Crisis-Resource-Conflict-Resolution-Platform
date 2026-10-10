process.env.AWS_EXECUTION_ENV = `AWS_Lambda_nodejs${process.versions.node.split(".")[0]}.x`;
const chromium = require("@sparticuz/chromium").default;
const { chromium: pw } = require("playwright-core");
const BASE = process.env.BASE_URL || "http://127.0.0.1:8000";
// Run against a FRESH backend (seeded demo data) that serves the built frontend. See scripts/README.md.
let failures = 0, step = 0;
const ok = (name, cond, extra = "") => { step++; if (!cond) failures++; console.log(`${cond ? "PASS" : "FAIL"} ${String(step).padStart(2)} ${name}${!cond && extra ? "  -> " + extra : ""}`); };
const shot = (page, path) => page.screenshot({ path, timeout: 6000 }).catch(() => console.log("   (screenshot skipped:", path.split("/").pop() + ")"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browsers = [];
async function newUser(_unused, label) {
  const browser = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter((a) => a !== "--single-process"), headless: true });
  browsers.push(browser);
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const st = document.createElement("style");
      st.textContent = "#stage{display:none !important} *,*::before,*::after{transition-duration:0s !important;animation-duration:0s !important;animation-delay:0s !important}";
      document.head.append(st);
    });
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|pexels|fonts/.test(m.text())) page.errors.push("console: " + m.text()); });
  await page.goto(BASE + "/?skipIntro", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__resqsyncReady === true, null, { timeout: 15000 });
  page.setDefaultTimeout(30000);
  page.label = label;
  return page;
}
async function login(page, email, password = "Resqsync#2026") {
  const open = await page.evaluate(() => document.querySelector("#login").classList.contains("is-open"));
  if (!open) await page.click("#authBtn");
  await page.waitForSelector("#loginForm", { timeout: 5000 });
  await page.fill("#loginForm [name=email]", email);
  await page.fill("#loginForm [name=password]", password);
  await page.click("#loginForm [type=submit]");
}
const text = (page, sel) => page.evaluate((s) => (document.querySelector(s)?.innerText || ""), sel);
const waitText = (page, sel, re, timeout = 8000) =>
  page.waitForFunction(([s, r]) => new RegExp(r, "i").test(document.querySelector(s)?.innerText || ""), [sel, re.source], { timeout }).then(() => true).catch(() => false);
const toast = (page) => text(page, "#workToast");
const go = async (page, module) => { await page.evaluate((m) => document.querySelector(`.workspace-sidebar [data-panel="${m}"]`).click(), module); await sleep(250); };

(async () => {
  const browser = null;
  try {
    // ---------- guest ----------
    const guest = await newUser(browser, "guest");
    await guest.click(".menu-btn, #menuBtn").catch(() => {});
    await guest.evaluate(() => document.querySelector('[data-panel="crises"]').click());
    await sleep(500);
    ok("module link for a guest opens sign-in (not data)", await guest.evaluate(() => document.querySelector("#login").classList.contains("is-open")));
    await login(guest, "arjun@example.org", "wrong-password-1");
    ok("wrong password shows an error", await waitText(guest, "#loginError", /invalid e-mail or password/));
    await guest.close();

    // ---------- crisis manager ----------
    const mgr = await newUser(browser, "manager");
    await login(mgr, "arjun@example.org");
    ok("manager lands in the 7-module workspace", await waitText(mgr, "#workspaceContent", /Active incidents/));
    ok("signed-in role is the real one (locked selector)", await mgr.evaluate(() => { const s = document.querySelector("#demoRole"); return s.disabled && s.value === "crisis-manager"; }));
    ok("overview shows 5 active incidents from the DB", /Active incidents\s*5/i.test((await text(mgr, "#workspaceContent")).replace(/\n/g, " ")));
    await shot(mgr, "/tmp/e2e/shots/01-manager-overview.png");

    // every module renders from server data without errors
    const modules = ["crises", "resources", "conflicts", "users", "collaboration", "analytics", "decision"];
    for (const m of modules) { await go(mgr, m); await sleep(500); }
    ok("all seven modules navigable after sign-in (routing fixed)", mgr.errors.length === 0, mgr.errors.join(" | "));

    await go(mgr, "conflicts");
    ok("conflicts: 4 pools under pressure", await waitText(mgr, "#workspaceContent", /4 pools under demand pressure/));
    await shot(mgr, "/tmp/e2e/shots/02-conflicts.png");

    // second user watching live
    const admin = await newUser(browser, "admin");
    await login(admin, "aditi@example.org");
    await waitText(admin, "#workspaceContent", /Recent activity/);

    // approve recommendation through the UI
    await mgr.evaluate(() => document.querySelector('[data-approve-pool="R-VENT"]').click());
    ok("approve toast confirms", await waitText(mgr, "#workToast", /Recommendation approved/));
    const vent = await mgr.evaluate(async () => (await (await fetch("/api/resources/R-VENT")).json()));
    ok("DB: ventilator pool fully allocated (10 used, 0 available)", vent.used === 10 && vent.available === 0, JSON.stringify([vent.used, vent.available]));
    ok("LIVE: admin's open page updated without reload (SSE)", await waitText(admin, "#workspaceContent", /Resource recommendation approved/, 8000));
    await shot(admin, "/tmp/e2e/shots/03-admin-live-update.png");

    // create a crisis via the form
    await go(mgr, "crises");
    await mgr.evaluate(() => document.querySelector('[data-toggle-form="newCrisis"]').click());
    await mgr.fill("#newCrisis [name=title]", "Patna river embankment breach");
    await mgr.fill("#newCrisis [name=city]", "Patna");
    await mgr.fill("#newCrisis [name=region]", "Bihar");
    await mgr.fill("#newCrisis [name=population]", "5400");
    await mgr.fill("#newCrisis [name=lat]", "25.5941");
    await mgr.fill("#newCrisis [name=lng]", "85.1376");
    await mgr.selectOption("#newCrisis [name=severity]", "4");
    await mgr.click("#newCrisis [type=submit]");
    ok("crisis created toast", await waitText(mgr, "#workToast", /Incident created/));
    ok("new crisis visible in the list", await waitText(mgr, "#workspaceContent", /Patna river embankment breach/));
    ok("LIVE: admin sees the new crisis", await waitText(admin, "#workspaceContent", /Patna river embankment breach|Recent activity/));
    const crisisList = await mgr.evaluate(async () => (await (await fetch("/api/crises")).json()).map((c) => c.title));
    ok("DB: crisis persisted", crisisList.includes("Patna river embankment breach"));

    // message + thread
    await go(mgr, "collaboration");
    await mgr.fill("textarea[name=text]", "Boats staged at the Gandhi Ghat, awaiting go.");
    await mgr.click('[data-work-form="message"] [type=submit]');
    ok("message posted", await waitText(mgr, "#workspaceContent", /Boats staged at the Gandhi Ghat/));

    // document upload
    await mgr.evaluate(() => document.querySelector('[data-communication-tab="documents"]').click());
    await sleep(300);
    require("fs").writeFileSync("/tmp/e2e/plan.txt", "evacuation plan v1");
    await mgr.setInputFiles("#workFile", "/tmp/e2e/plan.txt");
    await mgr.click('[data-work-form="attachment"] [type=submit]');
    ok("document uploaded and listed", await waitText(mgr, "#workspaceContent", /plan\.txt/));
    const dl = await mgr.evaluate(async () => { const a = (await (await fetch("/api/workspace")).json()).attachments[0]; const r = await fetch(`/api/attachments/${a.id}/download`); return await r.text(); });
    ok("document downloads from the server intact", dl === "evacuation plan v1", dl);

    // analytics from server + export
    await go(mgr, "analytics");
    ok("analytics loaded from API", await waitText(mgr, "#workspaceContent", /Incidents in range/));
    await shot(mgr, "/tmp/e2e/shots/04-analytics.png");
    const [download] = await Promise.all([mgr.waitForEvent("download", { timeout: 8000 }), mgr.evaluate(() => document.querySelector('[data-export="pdf"]').click())]);
    const pdfPath = "/tmp/e2e/report.pdf"; await download.saveAs(pdfPath);
    ok("PDF report downloaded from server", require("fs").readFileSync(pdfPath).slice(0, 8).toString().startsWith("%PDF-1.4"));

    // decision support
    await go(mgr, "decision");
    await mgr.click('[data-work-form="simulation"] [type=submit]');
    ok("simulation runs on server", await waitText(mgr, "#simulationResult", /Requested demand covered/));
    await mgr.evaluate(() => document.querySelector("[data-save-simulation]").click());
    ok("simulation saved", await waitText(mgr, "#workToast", /Simulation saved/));

    // ---------- permissions are enforced by the server, not just the UI ----------
    const viewer = await newUser(browser, "viewer");
    await login(viewer, "rohan@example.org");
    await waitText(viewer, "#workspaceContent", /Active incidents/);
    const denied = await viewer.evaluate(async () => (await fetch("/api/crises", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "x", city: "x", region: "x", category: "Flood", severity: 1, status: "active", population: 1, lat: 20, lng: 80 }) })).status);
    ok("viewer cannot create crises even by calling the API directly (403)", denied === 403, String(denied));
    ok("viewer sees buttons disabled", await viewer.evaluate(() => { const b = document.querySelector('[data-quick="crisis"]'); return b && b.disabled; }));
    ok("viewer has no Request desk button", await viewer.evaluate(() => document.querySelector("#openDeskBtn").hidden));

    // ---------- help seeker flow across four people ----------
    const seeker = await newUser(browser, "seeker");
    await seeker.click("#authBtn"); await seeker.waitForSelector("#loginForm");
    await seeker.click('[data-login-mode="register"]');
    await seeker.fill("#registerForm [name=name]", "Kavita Menon");
    await seeker.fill("#registerForm [name=email]", "kavita@example.org");
    await seeker.fill("#registerForm [name=password]", "Monsoon-Night-77");
    await seeker.click("#registerForm [type=submit]");
    ok("seeker registers and lands on the request desk", await waitText(seeker, "[data-role-title]", /Help seeker/));
    ok("seeker cannot open the workspace API", await seeker.evaluate(async () => (await fetch("/api/workspace")).status === 403));
    await seeker.fill("#raiseForm [name=address]", "14 Canal Road, Kochi");
    await seeker.fill("#raiseForm [name=phone]", "+91 98470 00011");
    await seeker.fill("#raiseForm [name=brief]", "Ground floor flooded, elderly parent upstairs.");
    await seeker.click("#raiseForm [type=submit]");
    ok("request raised and tracked", await waitText(seeker, "#roleWorkspace", /RSQ-0044/));
    await shot(seeker, "/tmp/e2e/shots/05-seeker-tracking.png");

    // manager (workspace user) opens the request desk and sees it live
    await mgr.evaluate(() => document.querySelector("#openDeskBtn").click());
    ok("manager reaches the request desk", await waitText(mgr, "[data-role-title]", /Crisis manager/));
    ok("LIVE: manager sees the new request without reload", await waitText(mgr, "#roleWorkspace", /RSQ-0044/));
    await mgr.evaluate(() => document.querySelector('[data-act="verify"][data-id="RSQ-0044"]').click());
    ok("manager verifies", await waitText(mgr, "#workToast", /RSQ-0044 is now Verified/));
    ok("LIVE: seeker's tracker moves to Verified", await waitText(seeker, "#roleWorkspace", /Verified/));
    await mgr.evaluate(() => { const card = document.querySelector('[data-act="assign"][data-id="RSQ-0044"]').closest(".req-actions"); card.querySelector("select").value = "R-AMB"; document.querySelector('[data-act="assign"][data-id="RSQ-0044"]').click(); });
    ok("manager assigns an ambulance", await waitText(mgr, "#workToast", /RSQ-0044 is now Assigned/));
    const amb = await mgr.evaluate(async () => (await (await fetch("/api/resources/R-AMB")).json()));
    ok("DB: shared inventory reflects the help-request assignment (5 of 8 used)", amb.used === 5, String(amb.used));

    const coord = await newUser(browser, "coordinator");
    await login(coord, "meera@example.org");
    ok("coordinator sees dispatch queue", await waitText(coord, "#roleWorkspace, #workspaceContent", /RSQ-0044|Active incidents/));
    await coord.evaluate(() => document.querySelector("#openDeskBtn").click());
    ok("coordinator desk lists the assigned request", await waitText(coord, "#roleWorkspace", /RSQ-0044/));
    await coord.evaluate(() => document.querySelector('[data-act="dispatch"][data-id="RSQ-0044"]').click());
    ok("coordinator confirms dispatch", await waitText(coord, "#workToast", /En route/));
    ok("LIVE: seeker sees En route", await waitText(seeker, "#roleWorkspace", /En route/));
    await mgr.evaluate(() => document.querySelector('[data-act="resolve"][data-id="RSQ-0044"]')?.click());
    ok("manager resolves; unit returns to the pool", await (async () => { await sleep(800); const a = await mgr.evaluate(async () => (await (await fetch("/api/resources/R-AMB")).json())); return a.used === 4; })());
    await shot(seeker, "/tmp/e2e/shots/06-seeker-resolved.png");

    const pages = [guest, mgr, admin, viewer, seeker, coord];
    const errs = pages.flatMap((p) => (p.errors || []).map((e) => `${p.label}: ${e}`));
    ok("no browser console/page errors during the whole run", errs.length === 0, errs.slice(0, 5).join(" | "));
  } catch (e) {
    failures++; console.log("CRASH", e.stack.split("\n").slice(0, 6).join("\n"));
  } finally { for (const b of browsers) await b.close().catch(() => {}); }
  console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL E2E CHECKS PASSED");
  process.exit(failures ? 1 : 0);
})();
