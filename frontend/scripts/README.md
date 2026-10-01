# Archive Startup Regression Check

The React page now mounts the archive directly. There is no iframe, splash,
Enter button, autoplay requirement, or asset-loading gate.

`public/archive/index.html` remains the standalone source. After editing it, run
`node scripts/sync-archive.cjs` to regenerate the native application markup and
controller in `src/archive-document.ts` and `src/archive-controller.ts`.

Run `node scripts/archive-startup-check.cjs` for controller-level regressions:

- Immediate startup without any media.
- Denied browser storage and malformed saved data.
- Legacy media-query listeners.
- All seven modules, menu controls, and light-mode switching.
- Safe native-controller cleanup and remounting.

Run `node scripts/archive-browser-check.cjs` after building for real headless
Chromium checks of the standalone page and the production React bundle, with
external fonts and media blocked. It covers desktop navigation, every module,
theme switching, Escape, and a 390px mobile viewport. The browser helper uses a
packaged Linux Chromium binary so minimal CI images do not need system Chrome.