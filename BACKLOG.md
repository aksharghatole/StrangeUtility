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
