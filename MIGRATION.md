# Migration tracker

Original repositories remain untouched. No archival until user approves and parity, data migration and deployment are verified.

| App | Source | Status | Next gate |
|---|---|---|---|
| Paperwork | [source commit](https://github.com/aksharghatole/Paperwork/tree/ea71b24311560a1148c5079162074562e750da30) | Code imported, unverified | Real PDF import/export and mobile tests; confirm licence |
| Blind | [source](https://github.com/aksharghatole/Blind) | Queued | Inspect PWA scope, colour storage, Android pipeline |
| word-to-pdf | [source](https://github.com/aksharghatole/word-to-pdf) | Merged; conversion tests passed | Security review; existing service on free plan |
| DeviceBridge | [source](https://github.com/aksharghatole/DeviceBridge) | Merged; HTTP/browser tests passed | Physical devices, licence review, backend switch |
| Daily Discovery | [source](https://github.com/aksharghatole/Daily-Discovery) | Code imported; local-only preview | CI, auth, persistence and licences |

Paperwork snapshot: original files reviewed at root, source HTML references pinned CDN PDF libraries; no standalone licence file found. Snapshot imported, not full Git history. Existing original is rollback path. Visual text replacement is not native text editing or secure redaction. Actual PDF engine tests pending.

See app-specific MIGRATION.md files. Render service configuration verified free and active (not live endpoint tests); portal links point to existing deployments, not replacements. Blind PR #2 still blocked by Android Maven 429. Pages run 45612053331 succeeded, subsequent run 45612096306 failed artifact retrieval despite readiness gate.
