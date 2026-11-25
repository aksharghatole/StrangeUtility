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
