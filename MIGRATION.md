# Migration tracker

Original repositories remain untouched. No archival until user approves and parity, data migration and deployment are verified.

| App | Source | Status | Next gate |
|---|---|---|---|
| Paperwork | [source commit](https://github.com/aksharghatole/Paperwork/tree/ea71b24311560a1148c5079162074562e750da30) | Merged; real PDF browser tests passed | Physical devices, dependency and licence review |
| Blind | [source commit](https://github.com/aksharghatole/Blind/tree/4485646b40ef039e7c2068ca2d3f5c674b85ae1f) | Merged; browser/offline tests and debug APK passed | Physical camera and native device tests |
| word-to-pdf | [source](https://github.com/aksharghatole/word-to-pdf) | Merged; conversion tests passed | Security review; existing service on free plan |
| DeviceBridge | [source](https://github.com/aksharghatole/DeviceBridge) | Merged; HTTP/browser tests passed | Physical devices, licence review, backend switch |
| Daily Discovery | [source](https://github.com/aksharghatole/Daily-Discovery) | Merged; automated tests passed, local-only | Production auth, persistence and licences |

Paperwork snapshot: original files reviewed at root, source HTML references pinned CDN PDF libraries; no standalone licence file found. Snapshot imported, not full Git history. Existing original is rollback path. Visual text replacement is not native text editing or secure redaction. Real-engine browser tests passed (45616957015); actual PDF import, annotation and export verified on Chromium.

See app-specific MIGRATION.md files. Render service configuration verified free and active (not live endpoint tests); portal links point to existing deployments, not replacements. Blind PR #2 merged after successful web and APK CI. Pages run 45612053331 succeeded, subsequent run 45612096306 failed artifact retrieval despite readiness gate.

Blind: app-relative PWA scope and namespaced cache and palette; same-origin legacy data migration is non-destructive. Original app and APK remain rollback paths. Full history not imported. Source snapshot contains no standalone LICENSE. Earlier Maven Central 429 failures resolved in run 45616343640; debug APK built, signature verified, artifact uploaded. Daily Discovery PR #7 merged after CI 45612994583. DeviceBridge main CI and Pages run 45612452928 succeeded. No replacements of backend services.

All five source imports merged. Paperwork PR #8 merged after green real-engine CI. No source repository ready to retire yet.

Blind PR #9 merged after browser 45617759146, APK 45617759159 and portal 45617759253 passed. Daily Discovery PR #10 merged after security regression CI 45617684928 and portal 45617685026 passed. Word-to-PDF resource admission and container hardening proposed; CI pending. Existing hosted service unchanged.

Word-to-PDF PR #11 merged at 8afb1fd after conversion and non-root Docker smoke CI 45618215910 and portal CI 45618215775. Existing Render service not switched. DeviceBridge admission safeguards proposed, portal links and accessibility improved; CI pending. Blind main APK 45617997034, browser 45617997192 and Daily Discovery main 45618024083 passed.

DeviceBridge PR #12 merged after CI 45618691896 and 45618691825. Paperwork same-origin engine packaging and offline tests proposed; download and offline CI pending. Browser cache may be evicted; documents remain memory-only. Existing hosted services unchanged.

Paperwork PR #13 merged after verified same-origin package preparation and offline PDF CI 45619328894 and portal CI 45619328036. DeviceBridge main CI 45619022398 passed. Pages run 45619022310 failed artifact retrieval after successful upload/readiness. Proposed separate package/deploy jobs with retry-safe artifact output and staging validation. Android manual preview prerelease workflow proposed; no release yet. No production signing key or backend switch.
