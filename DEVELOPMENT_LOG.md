# Development log

## 2026-11-25 — Foundation proposal
Created static searchable portal, migration registry, guidelines and structural tests; imported Paperwork's exact source snapshot. CI, deployment and real PDF tests pending. Original repositories unchanged.

## 2026-11-25 — Backend migrations and Daily Discovery
Word-to-PDF PR #4 merged, CI 45611652320 and main 45612096380 passed. DeviceBridge PR #6 merged, CI 45612026494 and 45612026907 passed. Pages PR #5 merged and main deployment 45612053331 succeeded; later deployment 45612096306 failed artifact retrieval despite polling. Blind APK run 45590948142 remains blocked by Maven 429. Imported Daily Discovery source without tracked SQLite file; added dependency declarations, CI, local-only instructions and existing free Render service links. No replacement backend or new paid resource. Daily CI and main Pages verification pending.

## 2026-11-25 — Reconcile Blind with current main
Daily Discovery PR #7 merged after app/auth/API CI 45612994583 and portal CI 45612994469 passed. DeviceBridge main CI 45612453033 and Pages deployment 45612452928 succeeded. Blind retry failed with Maven Central 429 (45590948142 attempt 2); preserve actual APK check. Merge current main into Blind branch, keep all other imported apps and central registry additions, retain artifact readiness gate, add Blind's static assets to staging. New CI pending; no originals changed.

## 2026-11-25 — All five sources merged; Paperwork verification
Blind web CI 45616343622 and APK CI 45616343640 passed including signature verification and artifact upload; PR #2 merged at 4c642e2. Previous Pages retry 45616239763 and Daily Discovery main CI 45616239671 passed. Added real PDF browser integration CI with synthetic fixture generation and independent output validation. Test results pending. Physical devices, licenses, security and replacement backend deployment still outstanding. Original repositories unchanged.

## 2026-11-25 — Paperwork verification and Blind browser tests
Paperwork PR #8 merged after real PDF CI 45616957015 and portal CI 45616956982 passed. Blind main APK 45616793469 and Pages 45616793167 passed. Add Blind browser coverage for synthetic photo, manual lookup, palette export, same-origin storage migration, accessibility simulation, outfit comparison, offline shell and simulated camera. No physical-device claim; tests pending.

Blind browser run 45617315735 reached the offline stage (photo, CSV, assistance and simulated camera assertions succeeded), then timed out because worker registration explicitly required https: even on trustworthy loopback HTTP. Register only in browser secure contexts (including loopback) with explicit app-relative scope; keep native WebView exclusion. Retry full unmodified browser test; verification pending.

## 2026-11-25 — Backend resource safety
Blind PR #9 merged after green browser, APK and portal checks (45617759146, 45617759159, 45617759253). Daily Discovery PR #10 merged after green auth tests and portal checks (45617684928, 45617685026). Added Word-to-PDF request-size and upload-deadline guard before multipart parsing, one active request per worker, cleanup on response failure, subprocess group termination and non-root Docker user. New regression tests and container smoke checks proposed; no new deployment or original service changes. CI pending.

## 2026-11-25 — DeviceBridge admission and portal improvements
Word-to-PDF PR #11 merged after CI 45618215910 and 45618215775; verified non-root container conversion. Blind main APK/browser and Daily Discovery main security checks passed. Added DeviceBridge bounded rate-limit storage, endpoint budgets, token comparison, header/request timeouts, heartbeat backpressure and cross-origin fetch guards; added regression tests. Added APK artifact workflow link, clearer launch notes and keyboard skip link to portal. CI pending. Query-token exposure, physical devices and backend cutover not yet resolved. Original services unchanged.

## 2026-11-25 — Paperwork local dependencies and offline shell
DeviceBridge PR #12 merged after integration and portal CI 45618691896 and 45618691825. Earlier Pages run 45618535524 failed at deploy step; new main deployment pending. Added exact npm archive SHA-512 lock, dependency preparation without lifecycle scripts, same-origin PDF engines/fonts/CMaps, versioned app-scoped offline cache and real browser offline export coverage. Hashes cross-checked against two public lockfiles per package, recorded in vendor-lock.json. Direct registry DNS unavailable in development container; actual download and browser verification deferred to CI. No replacement deployments or paid resources. Existing source repos unchanged.

## 2026-11-25 — Offline Paperwork and release pipeline
Paperwork PR #13 merged after green real PDF/offline CI 45619328894 and portal CI 45619328036. DeviceBridge main 45619022398 passed; Pages 45619022310 again failed at deploy artifact lookup. Separate package and deployment jobs, validate staged assets before upload, reuse build artifact name on deploy retry. Add opt-in main-only Blind debug prerelease job, SHA256 checksum, immutable commit tag and clear signing caveats. No release published yet; CI and post-merge deployment pending. Original repos/services unchanged.
