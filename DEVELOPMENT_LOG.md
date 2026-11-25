# Development log

## 2026-11-25 — Foundation proposal
Created static searchable portal, migration registry, guidelines and structural tests; imported Paperwork's exact source snapshot. CI, deployment and real PDF tests pending. Original repositories unchanged.

## 2026-11-25 — Blind migration proposal
Foundation PR #1 merged after successful CI. Imported Blind's web assets and native Android project; isolated cache and palette storage; added APK CI and migration tests. Web/Android tests, deployment and physical-device verification pending. Source repository untouched.

## 2026-11-25 — CI repair
PR #2 web checks passed (run 45585384045); Android setup failed (45585384453) because obsolete SDK package `tools` was requested. Use hosted SDK and install only required stable packages. Pages run 45585224346 initially could not find artifact, then retry found duplicate names; use attempt-specific artifact names for upload and deploy. Fixes pending CI. No deployment verified.

## 2026-11-25 — Android runner repair
PR #2 web CI passed on 292ded0 (run 45588813904). Android run 45588813683 failed at `command -v sdkmanager`: ubuntu-latest now resolves to Ubuntu 26.04, without sdkmanager on PATH. Pin ubuntu-24.04 and use setup-android v3 with explicit cmdline tools and packages, overriding the action's obsolete default `tools` package (verified action.yml). Verify SDK platform and apksigner before Gradle. New CI pending. Pages attempt-specific artifact fix remains pending main deployment; previous retry failed with duplicate artifacts. Original repositories unchanged.
