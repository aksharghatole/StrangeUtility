# Migration tracker

Original repositories remain untouched. No archival until user approves and parity, data migration and deployment are verified.

| App | Source | Status | Next gate |
|---|---|---|---|
| Paperwork | [source commit](https://github.com/aksharghatole/Paperwork/tree/ea71b24311560a1148c5079162074562e750da30) | Code imported, unverified | Real PDF import/export and mobile tests; confirm licence |
| Blind | [source commit](https://github.com/aksharghatole/Blind/tree/4485646b40ef039e7c2068ca2d3f5c674b85ae1f) | Merged; web CI and debug APK passed | Camera, offline and physical-device tests |
| word-to-pdf | [source](https://github.com/aksharghatole/word-to-pdf) | Merged; conversion tests passed | Security review; existing service on free plan |
| DeviceBridge | [source](https://github.com/aksharghatole/DeviceBridge) | Merged; HTTP/browser tests passed | Physical devices, licence review, backend switch |
| Daily Discovery | [source](https://github.com/aksharghatole/Daily-Discovery) | Merged; automated tests passed, local-only | Production auth, persistence and licences |

Paperwork snapshot: original files reviewed at root, source HTML references pinned CDN PDF libraries; no standalone licence file found. Snapshot imported, not full Git history. Existing original is rollback path. Visual text replacement is not native text editing or secure redaction. Actual PDF engine tests pending.

See app-specific MIGRATION.md files. Render service configuration verified free and active (not live endpoint tests); portal links point to existing deployments, not replacements. Blind PR #2 merged after successful web and APK CI. Pages run 45612053331 succeeded, subsequent run 45612096306 failed artifact retrieval despite readiness gate.

Blind: app-relative PWA scope and namespaced cache and palette; same-origin legacy data migration is non-destructive. Original app and APK remain rollback paths. Full history not imported. Source snapshot contains no standalone LICENSE. Earlier Maven Central 429 failures resolved in run 45616343640; debug APK built, signature verified, artifact uploaded. Daily Discovery PR #7 merged after CI 45612994583. DeviceBridge main CI and Pages run 45612452928 succeeded. No replacements of backend services.

All five source imports merged. Paperwork real-engine browser CI added in follow-up; results pending. No source repository ready to retire yet.
