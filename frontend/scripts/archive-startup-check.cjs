const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { Script } = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");

const documentSource = readFileSync(resolve(process.cwd(), "public/archive/index.html"), "utf8");
const nativeController = documentSource.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(nativeController, "The standalone controller is missing.");
new Script(nativeController, { filename: "archive-controller.js" });
assert.doesNotMatch(documentSource, /id="(?:splash|intro|enterArchive)"/, "A blocking loading gate must not return.");
assert.match(documentSource, /<body class="revealed">/, "The site must be visible before script initialization.");

const compiled = readFileSync(resolve(process.cwd(), "src/archive-controller.ts"), "utf8")
  .replace("export function initializeArchive()", "function initializeArchive()");
new Script(compiled, { filename: "compiled-archive-controller.js" });

function check({ compiledEntry = false, storageDenied = false, savedData = null, legacyMedia = false } = {}) {
  const errors = [];
  const output = new VirtualConsole();
  output.on("jsdomError", (error) => { if (!String(error.type).includes("css")) errors.push(error); });
  const dom = new JSDOM(documentSource, {
    url: "https://resqsync.test/", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: output,
  });
  const { window } = dom;
  window.matchMedia = (query) => ({
    matches: query.includes("pointer: fine"),
    ...(legacyMedia ? {} : { addEventListener() {}, removeEventListener() {} }),
    addListener() {}, removeListener() {},
  });
  window.scrollTo = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.Image = class { naturalWidth = 0; set src(value) { this.url = value; } get src() { return this.url; } };
  window.addEventListener("error", (event) => errors.push(event.error || new Error(event.message)));
  if (storageDenied) Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage denied"); } });
  else if (savedData) window.localStorage.setItem("resqsync-india-workspace-v3", savedData);

  try {
    if (compiledEntry) window.eval(`${compiled}\nwindow.archiveCleanup = initializeArchive();`);
    else window.eval(nativeController);
    assert.equal(window.__resqsyncReady, true, "Startup must complete synchronously without media.");
    assert.equal(window.document.getElementById("experience").inert, false);
    assert.equal(window.document.querySelectorAll(".card").length, 21);
    assert.equal(window.document.querySelector("#splash,#intro,#enterArchive"), null);

    const document = window.document;
    document.getElementById("menuBtn").click();
    assert.ok(document.body.classList.contains("menu-open"), "Menu button does not work.");
    document.querySelector("#menu [data-theme-toggle]").click();
    assert.equal(document.documentElement.dataset.theme, "light");
    document.querySelector("#menu [data-panel='overview']").click();
    assert.ok(document.body.classList.contains("panelopen"));
    for (const [id, title] of [["crises","Crises"],["resources","Resources"],["conflicts","Allocations"],["users","People & access"],["collaboration","Messages & files"],["analytics","Reports"],["decision","Scenario planning"]]) {
      document.querySelector(`.workspace-sidebar [data-panel='${id}']`).click();
      assert.equal(document.querySelector(".module-head h2").textContent, title);
    }
    document.querySelector("[data-close-panel]").click();
    assert.equal(document.body.classList.contains("panelopen"), false);
    if (compiledEntry) {
      window.archiveCleanup();
      window.eval("window.archiveCleanup = initializeArchive();");
      assert.equal(document.querySelectorAll(".card").length, 21, "A remount duplicates the sphere.");
      document.getElementById("menuBtn").click();
      assert.ok(document.body.classList.contains("menu-open"), "Duplicate listeners toggle the menu twice.");
      window.archiveCleanup();
    }
    assert.equal(errors.length, 0, errors.map((error) => error.stack || error.message).join("\n"));
  } finally { dom.window.close(); }
}

for (const options of [{},{ storageDenied:true },{ savedData:"invalid-json" },{ legacyMedia:true },{ compiledEntry:true },{ compiledEntry:true,storageDenied:true }]) check(options);
console.log("[archive-check] PASS: immediate startup, no entry gate, all modules, light mode, denied storage, and native remount cleanup.");