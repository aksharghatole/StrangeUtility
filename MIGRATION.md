# Migration tracker

Original repositories remain untouched. No archival until user approves and parity, data migration and deployment are verified.

| App | Source | Status | Next gate |
|---|---|---|---|
| Paperwork | [source commit](https://github.com/aksharghatole/Paperwork/tree/ea71b24311560a1148c5079162074562e750da30) | Code imported, unverified | Real PDF import/export and mobile tests; confirm licence |
| Blind | [source commit](https://github.com/aksharghatole/Blind/tree/4485646b40ef039e7c2068ca2d3f5c674b85ae1f) | Code imported, unverified | Web/Android CI, camera, palette and offline testing; confirm licence |
| word-to-pdf | [source](https://github.com/aksharghatole/word-to-pdf) | Queued | Preserve LibreOffice, review free backend |
| DeviceBridge | [source](https://github.com/aksharghatole/DeviceBridge) | Queued | Preserve WebRTC signaling and test two devices |
| Daily Discovery | [source](https://github.com/aksharghatole/Daily-Discovery) | Queued | Assess persistence and Streamlit hosting |

Paperwork snapshot: original files reviewed at root, source HTML references pinned CDN PDF libraries; no standalone licence file found. Snapshot imported, not full Git history. Existing original is rollback path. Visual text replacement is not native text editing or secure redaction. Actual PDF engine tests pending.

Blind: web assets and native Android source copied from pinned snapshot. Namespaced PWA cache and browser palette; same-origin legacy palette copied non-destructively, Android key unchanged. Different origins require separate data migration. Original repo and APK are rollback paths. No standalone licence in source snapshot; full history not imported.
