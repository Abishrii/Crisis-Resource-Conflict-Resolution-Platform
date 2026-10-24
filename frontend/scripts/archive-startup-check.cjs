const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { Script } = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");

const documentSource = readFileSync(resolve(process.cwd(), "public/archive/index.html"), "utf8");
const nativeController = documentSource.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(nativeController, "The standalone controller is missing.");
new Script(nativeController, { filename: "archive-controller.js" });
assert.doesNotMatch(documentSource, /id="(?:splash|enterArchive)"/, "An asset-loading gate must not return.");
assert.match(documentSource, /<body class="revealed">/, "The site must be visible before script initialization.");
assert.match(documentSource, /id="intro"[^>]+hidden inert/, "The intro must default to hidden if initialization fails.");

const compiled = readFileSync(resolve(process.cwd(), "src/archive-controller.ts"), "utf8")
  .replace("export function initializeArchive()", "function initializeArchive()");
new Script(compiled, { filename: "compiled-archive-controller.js" });

function check({ compiledEntry = false, storageDenied = false, savedData = null, legacyMedia = false, reducedMotion = false } = {}) {
  const errors = [];
  const output = new VirtualConsole();
  output.on("jsdomError", (error) => { if (!String(error.type).includes("css")) errors.push(error); });
  const dom = new JSDOM(documentSource, {
    url: "https://resqsync.test/", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: output,
  });
  const { window } = dom;
  window.matchMedia = (query) => ({
    matches: query.includes("pointer: fine") || (reducedMotion && query.includes("prefers-reduced-motion")),
    ...(legacyMedia ? {} : { addEventListener() {}, removeEventListener() {} }),
    addListener() {}, removeListener() {},
  });
  window.scrollTo = () => {};
  // The interface now talks to the ResQSync API. Stand in for a server where nobody is signed in.
  window.fetch = async (url) => {
    const path = String(url);
    const body = path.includes("/api/meta") ? { allowRegistration: true, demo: null } : { detail: "Sign in to continue." };
    return { ok: path.includes("/api/meta"), status: path.includes("/api/meta") ? 200 : 401, json: async () => body };
  };
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.play = function () { return Promise.reject(new Error("Blocked autoplay in regression test")); };
  window.Image = class { naturalWidth = 0; set src(value) { this.url = value; } get src() { return this.url; } };
  window.addEventListener("error", (event) => errors.push(event.error || new Error(event.message)));
  if (storageDenied) Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage denied"); } });
  else if (savedData) window.localStorage.setItem("resqsync-india-workspace-v3", savedData);

  try {
    if (compiledEntry) window.eval(`${compiled}\nwindow.archiveCleanup = initializeArchive();`);
    else window.eval(nativeController);
    assert.equal(window.__resqsyncReady, true, "Startup must complete synchronously without media.");
    if (reducedMotion) assert.equal(window.document.body.classList.contains("intro-active"),false);
    else {
      assert.equal(window.document.body.classList.contains("intro-active"),true,"The intro should appear on a fresh visit.");
      window.document.getElementById("skip").click();
    }
    assert.equal(window.document.getElementById("experience").inert, false);
    assert.equal(window.document.querySelectorAll(".card").length, 21);
    assert.equal(window.document.querySelector("#splash,#enterArchive"), null);

    const document = window.document;
    document.getElementById("menuBtn").click();
    assert.ok(document.body.classList.contains("menu-open"), "Menu button does not work.");
    document.querySelector("#menu [data-theme-toggle]").click();
    assert.equal(document.documentElement.dataset.theme, "light");
    document.querySelector("#menu [data-panel='overview']").click();
    assert.ok(document.body.classList.contains("login-open"), "Workspace links should open the sign-in gate.");
    assert.ok(document.querySelector("#loginForm [name=email]") && document.querySelector("#loginForm [name=password]"), "The sign-in form (e-mail and password) must be shown.");
    assert.equal(document.querySelector(".role-card"), null, "Role cards without a password must not return.");
    document.querySelector("#login [data-login-mode='register']").click();
    assert.ok(document.querySelector("#registerForm [name=password]"), "Help seekers must be able to create an account.");
    document.querySelector(".login-close").click();
    assert.equal(document.body.classList.contains("login-open"), false);
    document.getElementById("menuBtn").click();
    document.querySelector("[data-watch-intro]").click();
    assert.ok(document.body.classList.contains("intro-active"),"Watch intro should replay the film presentation.");
    document.querySelector("[data-intro-workspace]").click();
    assert.equal(document.body.classList.contains("intro-active"),false);
    if (compiledEntry) {
      window.archiveCleanup();
      window.eval("window.archiveCleanup = initializeArchive();");
      window.__resqsyncSkipIntro();
      assert.equal(document.querySelectorAll(".card").length, 21, "A remount duplicates the sphere.");
      document.getElementById("menuBtn").click();
      assert.ok(document.body.classList.contains("menu-open"), "Duplicate listeners toggle the menu twice.");
      window.archiveCleanup();
    }
    assert.equal(errors.length, 0, errors.map((error) => error.stack || error.message).join("\n"));
  } finally { dom.window.close(); }
}

for (const options of [{},{ storageDenied:true },{ savedData:"invalid-json" },{ legacyMedia:true },{ reducedMotion:true },{ compiledEntry:true },{ compiledEntry:true,storageDenied:true }]) {
  try {
    check(options);
  } catch (error) {
    error.message += ` [case: ${JSON.stringify(options)}]`;
    throw error;
  }
}
console.log("[archive-check] PASS: intro, skip, replay, sign-in gate, photo search, light mode, denied storage and remount cleanup.");