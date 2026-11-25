# Backlog

- Verify foundation CI and Pages deployment.
- Run real PDF fixtures and browser interactions for Paperwork; review licence and CDN dependency/offline improvements.
- Migrate Blind, then word-to-pdf, DeviceBridge, Daily Discovery.
- Preserve original deployments and data export/import; record rollback and parity.
- After migration, validate new useful app ideas and improve shared UI.

- Check latest Pages deploy and retry transient artifact errors only; one earlier run succeeded.
- Blind PR #2: keep Android check required; revisit Maven 429, reconcile central registry and documentation on merge.
- Word-to-PDF and DeviceBridge: original free Render service links in portal; review security, licences and real deployment parity before any cutover.
- Daily Discovery: run tests, fix upstream failures, require auth/persistence review and explicit free hosting feasibility before public exposure; exclude runtime DBs.

- Daily Discovery PR #7 merged after green CI; prioritize safe local-only defaults and production auth isolation before any hosting.
- Blind PR #2 reconciled with current main without discarding any of the other migrations; check new web and APK CI before merge. No dependency mirror bypass.
