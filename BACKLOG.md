# Backlog

- Verify foundation CI and Pages deployment.
- Paperwork real PDF fixtures and browser tests passed; review licence, CDN dependency/offline improvements and physical devices.
- All five source imports merged; complete functional and deployment verification.
- Preserve original deployments and data export/import; record rollback and parity.
- After migration, validate new useful app ideas and improve shared UI.

- Check latest Pages deploy and retry transient artifact errors only; one earlier run succeeded.
- Blind: browser offline caching and palette migration verified; test physical camera and native APK behavior.
- Word-to-PDF and DeviceBridge: original free Render service links in portal; review security, licences and real deployment parity before any cutover.
- Daily Discovery: run tests, fix upstream failures, require auth/persistence review and explicit free hosting feasibility before public exposure; exclude runtime DBs.

- Daily Discovery PR #7 merged after green CI; prioritize safe local-only defaults and production auth isolation before any hosting.
- Blind PR #2 merged after green web and APK CI; verify post-merge deployment and native artifact.

- Blind PR #9 merged after full browser and APK checks; physical hardware still pending.

- Daily Discovery PR #10 merged after auth isolation/rotation tests; production rate limits, TLS, storage and access-token revocation pending.
- Word-to-PDF: verify body admission, single-job limits, cleanup and non-root container; review parser/dependency security and free-tier memory before backend cutover.

- Word-to-PDF PR #11 merged after non-root container smoke; review parser security, service resource limits and cutover plan.
- DeviceBridge signaling safeguards: verify new cross-origin, request-limit, token comparison and browser pairing tests; query-token transport migration and physical devices remain pending.
- Portal: APK workflow artifact link added (expires under Actions retention; not permanent release); verify accessibility and deploy.

- DeviceBridge PR #12 merged after successful integration tests; verify main deploy, revisit SSE token transport and physical devices.
- Paperwork: verify pinned archive download, actual same-origin PDF rendering and offline export, dependency licensing and cache behavior. No offline claim before CI passes.

- Paperwork #13 merged; offline real PDF tests passed. Confirm latest production Pages deployment and physical devices.
- Pages split packaging from deployment, validate static staging and preserve package output on deploy-only retry; verify production deployment before claiming repair.
- Blind preview releases: manual main-only publication, checksum and debug-signing disclosure. Persistent signing and safe upgrades remain outstanding.

- DeviceBridge header-authenticated stream: verify browser parity, reconnection and legacy URL rejection before any cutover; existing users must reload updated shell.
- Blind manual release: run from main with publish_preview enabled; connector cannot dispatch. Verify release assets and update portal link only after publication.

- Blind release published and verified in 45620567477; direct portal links proposed. No need to dispatch again. Physical-device checks and persistent signing still open.
- DeviceBridge #15 merged after successful server/browser CI 45620451671 and portal CI 45620451695; production service still original.
- Backend cutover is blocked on approved migration settings, real hardware/network checks, security/licence review and quota verification. Follow docs/backend-cutover.md; no existing service changes or duplicate resources.

- PR #16 merged after backend and portal checks; new main deployment verification pending.
- TableDelta 0.1: implement strict CSV/TSV composite-key reconciliation, conflict exclusion, schema changes, safe rendering and export. First CI pending; then offline shell, larger dataset profiling, keyboard/mobile checks. One active new app. Backend cutover blockers remain documented; no source changes.

- TableDelta #17 merged; main browser 45626519582 and Pages deploy 45626519598 passed. Add app-scoped offline shell and verify offline comparison/export, cache isolation and no input persistence. Larger dataset profiling remains pending.

- PR #18 merged; main browser/offline run 45648681775 passed and Pages 45648681804 attempt 2 succeeded after transient deployment failure. TableDelta export batching and 10,000-row regression proposed; CI pending. Browser memory profiling and keyboard checks still outstanding. Backend cutover blockers unchanged.

- PR #19 browser run 45668571047 failed because the cache assertion still opened v2 after the worker moved to v3. Unit and portal checks passed. Fix test to inspect the single existing app cache and exact asset allowlist without creating a stale cache; rerun all checks before merge.

- PR #19 merged at 84c3e4f after green corrected browser 45678078126 and portal 45678078259. Main deployment pending verification. Add keyboard focus transitions for matching, results, pagination and clearing; browser regression pending. Physical device and backend cutover blockers unchanged.

- PR #20 merged; main browser 45698250883 and Pages verify/package/deploy 45698250643 passed. Fix stale comparisons during asynchronous file reads and reset delimiter on CSV import; regression pending. Profile large datasets next. Backend cutover gates unchanged.

- PR #21 merged at 4ab5f70; browser workflow 45716280922 and Pages workflow 45716280957 (verify, package, deploy) completed successfully. No open PRs or issues at inspection on 2026-11-26. Maximum-size performance profiling, physical-device checks and backend cutover gates remain outstanding.

## New-application priority (2026-11-26)
- Source consolidation complete; outstanding old-app improvements and backend cutover gates are nonblocking unless critical. Allocate at least 80% of rolling development runs to new applications; no successive maintenance-only runs absent critical incidents. Briefly check/merge green PRs, then implement a useful new app or finish a recent one.
- PR #22 merged after portal CI 45757155334; prior main Pages 45716280957 and TableDelta browser 45716280922 passed.
- WaveCut 0.1: new audio editor, strict PCM16 WAV parsing, trim, quiet-edge detection, waveform, fades, peak normalization, playback and export. Unit/browser checks pending. Follow-up: offline shell, large-file performance and format compatibility; then rotate to a distinct new utility.

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
