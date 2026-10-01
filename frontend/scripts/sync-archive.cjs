const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { Script } = require("node:vm");

const archive = readFileSync(resolve(process.cwd(), "public/archive/index.html"), "utf8");
const style = archive.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const body = archive.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1];
const controller = archive.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!style || !body || !controller) throw new Error("The standalone archive is incomplete.");
new Script(controller, { filename: "archive-controller.js" });

const markup = body.replace(/<script>[\s\S]*?<\/script>/g, "").replace(/<noscript>[\s\S]*?<\/noscript>/g, "").trim();
writeFileSync(resolve(process.cwd(), "src/archive-document.ts"), [
  "// Generated from public/archive/index.html by scripts/sync-archive.cjs.",
  `export const archiveStyles = ${JSON.stringify(style)};`,
  `export const archiveMarkup = ${JSON.stringify(markup)};`,
  "",
].join("\n"));

// Compile the existing controller as ordinary application code, not an inline
// iframe script or eval. Lifecycle wrappers keep React remounts safe.
const compiled = controller
  .replace(/(\$\("[^"\n]+"\))\.addEventListener\(/g, "listen($1,")
  .replace(/\b([a-zA-Z_$][\w$]*)\.addEventListener\(/g, "listen($1,")
  .replace('shots.forEach((shot,index) => {', '$("#orb").replaceChildren(); $("#grid .rows").replaceChildren(); $(".credit-list").replaceChildren();\n    shots.forEach((shot,index) => {');
const lifecycle = `
  const abort = new AbortController();
  const timers = new Set();
  const frames = new Set();
  let disposed = false;
  const setTimeout = (callback, delay = 0) => {
    const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
    timers.add(id);
    return id;
  };
  const clearTimeout = (id) => { timers.delete(id); window.clearTimeout(id); };
  const requestAnimationFrame = (callback) => {
    const id = window.requestAnimationFrame((time) => { frames.delete(id); if (!disposed) callback(time); });
    frames.add(id);
    return id;
  };
  const cancelAnimationFrame = (id) => { frames.delete(id); window.cancelAnimationFrame(id); };
  const listen = (target, event, callback, options = {}) => {
    target.addEventListener(event, callback, { ...(typeof options === 'boolean' ? { capture: options } : options), signal: abort.signal });
  };
  const dispose = () => {
    disposed = true;
    abort.abort();
    timers.forEach((id) => window.clearTimeout(id));
    frames.forEach((id) => window.cancelAnimationFrame(id));
    document.body.classList.remove('menu-open', 'gridview', 'lit', 'panelopen', 'dragging', 'deep', 'has-pointer');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.__resqsyncReady = false;
  };
`;
writeFileSync(resolve(process.cwd(), "src/archive-controller.ts"), [
  "// @ts-nocheck",
  "// Generated from the standalone controller. Run scripts/sync-archive.cjs to sync.",
  "export function initializeArchive() {",
  lifecycle,
  "  try {",
  compiled,
  "  } catch (error) { dispose(); throw error; }",
  "  return dispose;",
  "}",
  "",
].join("\n"));
console.log("[archive-sync] Native markup and controller generated without iframe or eval.");