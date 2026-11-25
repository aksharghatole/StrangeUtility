# Paperwork — browser PDF editor

A static, local-first PDF editor. No backend, sign-in, database, or API key needed.

## Run
Open `index.html` in a modern desktop or mobile browser with internet access (required to fetch the pinned PDF.js and pdf-lib modules). If your browser blocks local file access, run `python -m http.server 8000` in this folder and open http://localhost:8000/.

## Deploy
Push `index.html` and this README to a GitHub repository. Under Settings → Pages, select Deploy from a branch, choose main and / (root), then Save. Alternatively use a static site host. No build step required.

## Features
Open and merge PDFs, drag to reorder pages, duplicate, rotate, delete and extract pages, add/move/delete text overlays, pen strokes, highlights, rectangles, whiteout, images, and handwritten visual signatures. Undo/redo, zoom, fit and PDF export.

PDF file bytes stay in browser memory; the app fetches its libraries from jsDelivr. Export copies original PDF pages and adds rasterized annotation overlays. Added text is not searchable; original page content is not deliberately rasterized. Whiteout is NOT secure redaction. Existing PDF text cannot be directly edited. Password-protected PDFs, certificate signatures, forms and advanced PDF features are not guaranteed. Save before closing or refreshing; no persistent storage. Existing digital signatures may become invalid. Do not rely on this version for sensitive/legal records without testing.

## Verification
JavaScript syntax checked using Node. Browser interactions tested with simulated PDF engines, not actual PDF parsing/export. Network restriction prevented fetching actual external libraries during testing.

## Zoom and existing text replacement

- Use the footer percentage field, +/−, Fit page, Fit width, or Actual size. Ctrl/Cmd + wheel or +/− zooms around the document; Ctrl/Cmd + 0 fits the page. Hand mode allows mouse panning and touch scrolling.
- Choose **Edit PDF text** and click a selectable horizontal text run. Change the replacement, size, text color, background cover, and fit-width setting. Leave replacement blank to visually cover the run. Undo and redo are supported.
- This is visual replacement, not native content-stream editing or secure redaction. Original text remains in the exported PDF, and added replacement text is rasterized in the overlay. Complex fonts, vertical/rotated text runs, scans, and patterned backgrounds may not work as expected. Do not use this tool to remove sensitive information.

## StrangeUtility import
Source: https://github.com/aksharghatole/Paperwork/tree/ea71b24311560a1148c5079162074562e750da30
Imported unchanged. Functional browser/PDF tests are pending. No standalone LICENSE was present at this source snapshot; preserve authorship and do not infer an open-source licence.
