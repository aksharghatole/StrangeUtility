# Paperwork — browser PDF editor

A static, local-first PDF editor. No backend, sign-in, database, or API key needed.

## Run and deploy
From the monorepo root, run `python apps/paperwork/prepare_vendor.py`, then `python -m http.server 8000` and open http://localhost:8000/apps/paperwork/. The one-time preparation downloads two exact npm archives and verifies their SHA-512 integrity before copying browser builds, fonts and CMaps. No package lifecycle scripts are executed. GitHub Pages CI prepares and publishes the same assets. Do not open the unprepared source HTML directly.

After a successful service-worker installation on HTTPS or trustworthy loopback, the editor and packaged dependencies can be reopened offline. PDFs remain in browser memory; save before closing. Browser cache eviction, unsupported service workers or failed installation can prevent offline use.

## Features
Open and merge PDFs, drag to reorder pages, duplicate, rotate, delete and extract pages, add/move/delete text overlays, pen strokes, highlights, rectangles, whiteout, images, and handwritten visual signatures. Undo/redo, zoom, fit and PDF export.

PDF file bytes stay in browser memory; the app loads its packaged libraries from its own origin. Export copies original PDF pages and adds rasterized annotation overlays. Added text is not searchable; original page content is not deliberately rasterized. Whiteout is NOT secure redaction. Existing PDF text cannot be directly edited. Password-protected PDFs, certificate signatures, forms and advanced PDF features are not guaranteed. Save before closing or refreshing; no persistent storage. Existing digital signatures may become invalid. Do not rely on this version for sensitive/legal records without testing.

## Verification
Real PDF import, annotation, export and mobile browser smoke passed in CI 45616957015 and 45617187462. The self-hosted/offline change adds offline verification; new checks pending.

## Zoom and existing text replacement

- Use the footer percentage field, +/−, Fit page, Fit width, or Actual size. Ctrl/Cmd + wheel or +/− zooms around the document; Ctrl/Cmd + 0 fits the page. Hand mode allows mouse panning and touch scrolling.
- Choose **Edit PDF text** and click a selectable horizontal text run. Change the replacement, size, text color, background cover, and fit-width setting. Leave replacement blank to visually cover the run. Undo and redo are supported.
- This is visual replacement, not native content-stream editing or secure redaction. Original text remains in the exported PDF, and added replacement text is rasterized in the overlay. Complex fonts, vertical/rotated text runs, scans, and patterned backgrounds may not work as expected. Do not use this tool to remove sensitive information.

## StrangeUtility import
Source: https://github.com/aksharghatole/Paperwork/tree/ea71b24311560a1148c5079162074562e750da30
Imported unchanged. Real PDF browser tests passed before this packaging change. No standalone LICENSE was present at this source snapshot; preserve authorship and do not infer an open-source licence.
