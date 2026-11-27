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

## 2026-11-25 — Header-authenticated DeviceBridge signaling
PR #14 merged after portal packaging, Blind APK and browser CI 45619958755, 45619958613, 45619958741. Paperwork main browser/Pages CI 45619778264 and 45619778266 succeeded. Latest main workflows still running. Manual Android release workflow is ready, but connector lacks dispatch action; no release published. Replace URL tokens in DeviceBridge SSE with Authorization-header fetch stream, bounded parser/reconnect and regression tests. Render inspection confirms existing free services still point to original repos; no service settings changed. CI pending.

## 2026-11-25 — Published Blind preview and backend cutover planning
Manual Android workflow 45620567477 passed build/signature and release publication; release blind-preview-957522aa3249 contains 1,192,347-byte APK and SHA256SUMS.txt. DeviceBridge PR #15 merged after CI 45620451671 and 45620451695. Pages 45620295914 and Blind main APK/browser checks passed. Add verified permanent release links and backend cutover checklist based on existing free service configurations. No new service or production cutover. Portal CI pending.

## 2026-11-25 — First new utility: TableDelta
Merged PR #16 after CI 45621246788, 45621246467 and 45621246443. DeviceBridge main CI 45621121463 and Pages 45621121460 passed. Researched CSV diff alternatives, RFC 4180 and OWASP spreadsheet formula risk; selected a bounded local-first composite-key reconciliation tool. Implemented strict CSV/TSV parser, duplicate/blank key conflict reports, schema differences, searchable paginated records, JSON and spreadsheet-oriented CSV export, responsive UI and unit/browser test workflows. Registry and Pages staging updated; CI pending. No new service or costs. Remaining original-app migration blockers remain in docs/backend-cutover.md.

## 2026-11-25 — TableDelta offline shell
PR #17 merged at 1796c0a; PR checks 45621926701 and 45621927019 passed. Main browser 45626519582 and Pages verify/package/deploy 45626519598 passed. No open PRs/issues at start. Add exact-URL static-only app-scoped service worker, readiness status, offline reload/export regression and staging checks. No input persistence, no backend changes. New CI pending; physical devices and backend cutover gates unchanged.

## 2026-11-25 — Deployment recovered and bounded CSV export allocation
PR #18 merged; main ff843f6 browser/offline run 45648681775 passed. Pages run 45648681804 attempt 2 succeeded. No open PRs/issues at inspection. Replace per-field export row arrays with batches of encoded CSV lines, preserving output format; add maximum-row and input-limit regressions, bump offline cache version, reconcile registry status. New CI pending; no measured memory or speed claim. Original repos and services unchanged.

## 2026-11-26 — TableDelta export regression repair
PR #19 remains open. Browser run https://github.com/aksharghatole/StrangeUtility/actions/runs/45668571047 failed at cache inspection: test opened obsolete v2 while worker uses v3. Unit tests and portal run 45668570905 passed. Main deployment 45648681804 remains successful. Replace hard-coded cache version with enumeration of exactly one existing app cache and exact expected URLs, preserving offline reload/export assertions. Updated existing PR rather than creating overlapping work. New checks pending; no service changes.

## 2026-11-26 — Keyboard workflow
Merged [PR #19](https://github.com/aksharghatole/StrangeUtility/pull/19) after corrected browser run 45678078126 and portal run 45678078259 passed. Previous production run 45648681804 succeeded; new main deployment not yet verified. Add focus management and keyboard regression coverage for dynamic comparison steps and pagination; bump shell cache and preview version. No new dependencies or services. CI pending; no full accessibility certification claimed.

## 2026-11-26 — Input loading consistency
[PR #20](https://github.com/aksharghatole/StrangeUtility/pull/20) merged; main browser [45698250883](https://github.com/aksharghatole/StrangeUtility/actions/runs/45698250883) and Pages [45698250643](https://github.com/aksharghatole/StrangeUtility/actions/runs/45698250643) passed, including deploy job. No open PRs/issues at inspection. Correct asynchronous file-read race by disabling inspection while reads are pending, invalidating stale reports, cancelling pending reads on manual edits and resetting delimiter on import. Add delayed-read browser regression, bump shell cache, reconcile registry and README. New CI pending. No backend or source repository changes.

## 2026-11-26 — Verification reconciliation
PR #21 merged at 4ab5f70; browser workflow 45716280922 and Pages workflow 45716280957 (verify, package, deploy) completed successfully. No open PRs or issues at inspection on 2026-11-26. Maximum-size performance profiling, physical-device checks and backend cutover gates remain outstanding.

## 2026-11-26 — Manual run: new application WaveCut
Merged PR #22 after portal CI 45757155334 passed; previous main Pages/browser CI 45716280957 and 45716280922 passed. Prioritized new development per user direction. Built a bounded original PCM16 WAV editor with strict RIFF parsing, non-destructive sample-rounded trim, quiet-edge detection, waveform, linear fades, peak normalization, browser playback and download. Added six Node tests, mobile upload/edit/export smoke test with independent Python WAV verification, registry, research note and Pages staging. New CI and deployment pending. No backend, dependencies, uploads or additional expenditure. Existing source repos and services unchanged.

## 2026-11-26 — SlotWeave 0.1
New local-first shared availability calculator on feature/slotweave; core, UI, text export and unit tests committed. CI, Pages staging and browser checks pending. Same-day single interval per person, no timezone conversion or persistence. Next: verify staging, keyboard/mobile and multi-window support. PocketScan PR #24 remains independent. No new dependencies or services.

## DataForge 0.1 — 2026-11-26
CSV consolidation, normalized column alignment, key deduplication, undo, preview and formula-safe export implemented on feature/dataforge. Tests written; CI and deployment pending. Next: XLSX support, worker processing, explicit mapping and browser tests. No paid services. SlotWeave PR #27 merged with green PR checks; production deployment not independently verified.

## DataForge 0.2 — 2026-11-26
PR #28 merged; PR CI 45793368357 passed. Added non-destructive duplicate merge, missing-key retention and conflict CSV report on feature/dataforge-merge. New tests written; CI and deployment pending. Next XLSX import and explicit column mapping.

## DataForge 0.3 — 2026-11-26
PR #29 merged with CI 45793633089 green. Added ExcelJS 4.4.0 build-time browser bundle, XLSX import of visible sheets, cached formula values and text-only XLSX export. Adapter test added; real workbook roundtrip and browser tests pending. Limits remain 50 files/20 MB; no paid services. Next: bounded decompression, worker processing and explicit mapping.

## DataForge 0.4 — 2026-11-26
PR #30 merged, CI 45793883339 passed. Added cancellable worker import, progress, optional source columns, 250-file cap with unchanged 20 MB total, incremental output limits and ZIP metadata preflight. Metadata guard is not a complete decompression bound against forged ZIP metadata. Browser and stress tests pending. Next real workbook roundtrip, worker compatibility and mapping.

## DataForge 0.5 — 2026-11-26
PR #31 merged, CI 45794193194 green. Added post-import column rename/coalesce/drop, conflict audit, undo and missing/distinct profiling. Unit tests written; CI/browser pending. Next real workbook browser roundtrip and stress tests, worksheet selection, bulk transformations.

## DataForge 0.6 — 2026-11-26
PR #32 merged with CI 45794624557 green. Added trim/collapse whitespace, case conversion, literal replacement, fill blanks, row filtering and first-delimiter split with confirmation and one-step undo. Tests written; CI/browser pending. Next workbook browser roundtrip, dataset joins and reusable workflows.

## DataForge 0.7 — 2026-11-26
PR #34 merged with CI 45800201695 green. Added left/inner/anti joins against one CSV/XLSX lookup, duplicate-key rejection, optional case-insensitive matching, collision-safe headers, match counts and undo. Tests written; CI/browser pending. Next real workbook browser roundtrip and reusable workflows.

## CutLedger 0.1 — 2026-11-26
PR #35 merged; PR CI 45800436472 passed; main deployment unverified. New distinct engineering utility on feature/cutledger: best-fit decreasing stock cutting, kerf, cost, diagrams and text export. Heuristic assessment (not market research): usefulness 9, feasibility 9, demand 7, privacy/cost 10, uniqueness 6, maintainability 9; weighted 8.55/10. Core tests written; CI/browser pending. Next verify and add mixed stock lengths if useful. No dependencies or paid services.

## 2026-11-26 — CutLedger 0.2
PR #36 https://github.com/aksharghatole/StrangeUtility/pull/36: CI 45823179114 failed registry source field (44/45 tests passed); fixed missing source without weakening validation. Added finite reusable offcut inventory, purchase-only costing, per-stock diagrams and conservation tests. New CI pending; no deployment verified. Heuristic, no optimality guarantee; next browser and print checks. Other open app PRs #24 and #33 remain independent. No paid dependencies or services.

## ContrastField 0.1 — 2026-11-26
CutLedger PR #36 merged at cc36f68 after verify/package 45832401047 passed; deployment unverified. PrintScale #33 and PocketScan #24 failed checks and remain open. New distinct accessibility utility: palette-wide WCAG contrast matrix, foreground repair and CSV export. Reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (implementation reference, demand not independently researched). Heuristic scores usefulness 8, feasibility 10, demand 7, privacy/cost 10, uniqueness 7, maintainability 9; weighted 8.55/10. Core tests written, CI/browser pending. No paid resources. Next verify browser and deployment; resolve other app conflicts separately.

## SubtitleBench 0.1 — 2026-11-26
Continued existing feature/subtitlebench core and tests with working import/paste, timing offset and scale, overlap/readability audit, original reset and SRT/VTT downloads. ContrastField #37 merged, PR CI 45841972663 passed; main merge workflow not returned. #24 and #33 remain failed/conflicted. SubtitleBench CI/browser/deployment pending. Reference specification https://www.w3.org/TR/webvtt1/ (not independently retrieved this run). Heuristic scores 8/9/7/10/7/9, weighted 8.35/10. No paid resources. Next verify browser roundtrip and deployment; cue positioning and metadata preservation deferred.

## SubtitleBench 0.2 — 2026-11-27
PR #38 merged, CI 45862634196 passed. New branch feature/subtitlebench-preview adds local video playback, literal active caption display, cue seeking and two-point drift correction. Core regression tests added; CI/browser/deployment pending. #24 and #33 remain failed/conflicted. Browser codec support varies; no video transcoding. Next browser verification and release, then rotate category. No paid resources.

## FileManifest 0.1 — 2026-11-27
SubtitleBench main workflow 45886435325 reported success. Open #24 and #33 remain separate. New feature/filemanifest implements local SHA-256 snapshots, validated JSON import/export and four-state comparison; core tests added. Core commit 38fc0469e483c9e7da0ac0fc94f749e2175509eb. Heuristic scores 9/9/7/10/7/9 = 8.65/10; demand not independently measured. CI and browser verification pending. Next: verify packaging and real browser folder selection, consider streaming for larger files. No paid resources.
## 2026-11-27 — PocketScan fault repair
Rebased the PocketScan preview onto current main while preserving the newer portal, registry and Pages workflow. Prior CI passed unit tests and dependency archive integrity checks but failed its real offline browser test: the OCR fixture produced an empty recognized-text value. OCR now dynamically imports the packaged ESM library on demand and selects its packaged LSTM-only core, avoiding a missing-global failure. The browser test reports app status immediately, and the Pages workflow now prepares and stages the offline OCR assets. CI must verify the OCR fix before merge.

## 2026-11-27 — PrintScale integration and print verification
Rebuilt the PrintScale change on top of the current main branch so the launch-only portal and PocketScan package remain intact. Staged the app in GitHub Pages, added a staging guard and strengthened overlap, bounds and sheet-limit tests. Added Chromium coverage for local image preview, six A4 print sheets, generated PDF dimensions and mobile overflow. Physical printer calibration remains device-specific.

- 2026-11-27: UnitSpec 0.1 signed asymmetric tolerance chain, RSS estimate and JSON export; core tests committed at c920843e63f8031283a32f529b35a78f3aec4132. CI/browser/deployment pending. Next: visual and keyboard verification. Method: https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir6524.pdf
