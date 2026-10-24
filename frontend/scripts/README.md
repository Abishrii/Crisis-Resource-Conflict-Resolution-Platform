# Archive Startup Regression Check

The React page mounts the archive directly. A short cinematic intro plays over
the already-initialized page; it is not a splash or an asset-loading gate.
Skip, Escape, and Open workspace dismiss it immediately. Unavailable media
falls back to an Indian response image and exits automatically. The intro is
bounded to roughly five seconds, and reduced motion bypasses automatic play.
The menu's Watch intro control replays it. `?skipIntro=1` opens directly.

`public/archive/index.html` remains the standalone source. After editing it, run
`node scripts/sync-archive.cjs` to regenerate the native application markup and
controller in `src/archive-document.ts` and `src/archive-controller.ts`.

`npm ci` installs the Playwright/Chromium helpers used by the browser checks, and
`npm run typecheck` validates the TypeScript sources.

Run `node scripts/archive-startup-check.cjs` for controller-level regressions:

- Immediate workspace initialization without any media.
- Intro presentation, skip, replay, and direct workspace entry.
- Denied browser storage and malformed saved data.
- Legacy media-query listeners.
- All seven modules, menu controls, and light-mode switching.
- Safe native-controller cleanup and remounting.

Run `node scripts/archive-browser-check.cjs` after building for real headless
Chromium checks of the standalone page and the production React bundle, with
external fonts and media blocked. It covers desktop navigation, every module,
theme switching, intro auto-exit with media blocked, reduced motion, Escape,
and a 390px mobile viewport. The browser helper uses a
packaged Linux Chromium binary so minimal CI images do not need system Chrome.