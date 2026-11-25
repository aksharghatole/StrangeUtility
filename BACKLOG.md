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
