# StrangeUtility

A free, noncommercial collection of practical browser applications. No ads or mandatory accounts for the static tools.

**[Launch StrangeUtility](https://aksharghatole.github.io/StrangeUtility/)** · [Report an issue](https://github.com/aksharghatole/StrangeUtility/issues/new) · [Build and deployment checks](https://github.com/aksharghatole/StrangeUtility/actions)

## Application directory

| Application | Category | What it does | Access | Status |
| --- | --- | --- | --- | --- |
| Paperwork | Documents | Edit, annotate, reorder and export PDFs locally. | [Open Paperwork](https://aksharghatole.github.io/StrangeUtility/apps/paperwork/) · [Source](apps/paperwork/) | Testing preview |
| Blind | Accessibility | Camera and photo colour assistant. | [Open Blind](https://aksharghatole.github.io/StrangeUtility/apps/blind/) · [Source](apps/blind/) | Testing preview |
| Word to PDF | Documents | Server-side document conversion with LibreOffice. | [Open hosted service](https://word-to-pdf-b4dr.onrender.com/app/) · [Source](apps/word-to-pdf/) | Testing preview |
| DeviceBridge | Connectivity | Share files and text between devices. | [Open hosted service](https://devicebridge-4ncq.onrender.com/) · [Source](apps/devicebridge/) | Testing preview |
| Daily Discovery | Learning | Explore new knowledge and track progress. | Local only · [Source](apps/daily-discovery/) | Testing preview |
| TableDelta | Data tools | Compare CSV snapshots by stable keys, identify changed records and export reconciliation reports. | [Open TableDelta](https://aksharghatole.github.io/StrangeUtility/apps/tabledelta/) · [Source](apps/tabledelta/) | Testing preview |
| WaveCut | Audio | Trim WAV recordings, find quiet edges, add fades and normalize peaks privately. | [Open WaveCut](https://aksharghatole.github.io/StrangeUtility/apps/wavecut/) · [Source](apps/wavecut/) | Preview; deployment unverified |

Links to Pages apps are their configured launch addresses; preview availability depends on successful deployment. Hosted services may sleep or be temporarily unavailable. Daily Discovery is not publicly hosted. PocketScan is proposed in [PR #24](https://github.com/aksharghatole/StrangeUtility/pull/24), not a released app.

### Blind for Android

[Download preview APK](https://github.com/aksharghatole/StrangeUtility/releases/download/blind-preview-957522aa3249/Blind-Android-preview.apk) · [SHA-256 checksums](https://github.com/aksharghatole/StrangeUtility/releases/download/blind-preview-957522aa3249/SHA256SUMS.txt) · [Release notes](https://github.com/aksharghatole/StrangeUtility/releases/tag/blind-preview-957522aa3249)

Debug-signed testing build; physical-device verification is pending. Export saved colours before upgrading; signing keys may differ.

## Privacy and limitations

- Static tools process files locally. Offline availability varies by app and browser cache.
- Word to PDF sends documents to the conversion server; DeviceBridge uses hosted signaling.
- Paperwork visual text replacement is not secure redaction.
- WaveCut currently supports mono/stereo PCM16 WAV only.
- Testing previews are not stable releases.

## Run locally

Clone this repository, then from its root run:

```sh
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Some imported applications require additional dependencies or backend setup; consult their source directories. The development server is not a production deployment.

## Development

Run the root checks:

```sh
node --test tests/*.test.mjs
```

- [Application registry](registry.json)
- [Development instructions](AGENTS.md)
- [Backlog](BACKLOG.md)
- [Development log](DEVELOPMENT_LOG.md)
- [Migration tracker](MIGRATION.md)
- [Backend cutover checklist](docs/backend-cutover.md)
- [Pull requests](https://github.com/aksharghatole/StrangeUtility/pulls)
- [Releases](https://github.com/aksharghatole/StrangeUtility/releases)

New applications should be local-first, accessible, responsive and free to operate. Use a branch and pull request, add tests, update the registry and this directory, and merge only after required checks pass. Original source repositories and deployments are preserved.
