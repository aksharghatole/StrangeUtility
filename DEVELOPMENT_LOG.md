# Development log

## 2026-11-25 — Foundation proposal
Created static searchable portal, migration registry, guidelines and structural tests; imported Paperwork's exact source snapshot. CI, deployment and real PDF tests pending. Original repositories unchanged.

## 2026-11-25 — Blind migration proposal
Foundation PR #1 merged after successful CI. Imported Blind's web assets and native Android project; isolated cache and palette storage; added APK CI and migration tests. Web/Android tests, deployment and physical-device verification pending. Source repository untouched.

## 2026-11-25 — CI repair
PR #2 web checks passed (run 45585384045); Android setup failed (45585384453) because obsolete SDK package `tools` was requested. Use hosted SDK and install only required stable packages. Pages run 45585224346 initially could not find artifact, then retry found duplicate names; use attempt-specific artifact names for upload and deploy. Fixes pending CI. No deployment verified.
