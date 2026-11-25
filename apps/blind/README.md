# Blind — Colour Lens v1.2

A privacy-first colour assistant for Android and the web.

- Live camera and photo colour sampling, 242 named references, exact sampled HEX/RGB/HSL and approximate CMYK.
- Speech, simple colour families, flashlight where supported, saved colours and CSV export.
- Vision assistance: approximate protanopia, deuteranopia, tritanopia and greyscale previews; original sample stays unchanged.
- Clothing: compare two garment colours, brightness contrast, subjective coordination suggestions and spoken results.
- Offline PWA and installable Android APK project.

## Web
https://aksharghatole.github.io/Blind/

## Android APK
Open [Build Android APK](https://github.com/aksharghatole/Blind/actions/workflows/android.yml). After a successful run, download the Blind-Android-debug artifact, unzip it and install app-debug.apk on Android. If Android blocks installation, review the app source and grant install permission only to the trusted file manager used to open the APK. Debug signing is for testing only. See [Android build instructions](android/README.md).

Android uses a native Java shell and local WebView UI. Device testing is required. Colour simulations are not diagnostic or medical tools; do not rely on camera colour identification for safety-critical decisions. Lighting affects measurements. Clothing advice is subjective. Saved colours remain in local device storage; web and APK have separate collections.

## StrangeUtility migration
Source snapshot: https://github.com/aksharghatole/Blind/tree/4485646b40ef039e7c2068ca2d3f5c674b85ae1f
Web preview at `apps/blind/`. Native Android source is retained and built by the monorepo workflow; original APK workflow remains available. Browser uses a new namespaced palette key, and on first launch copies valid saved colours from the original same-origin key if present; original palette is never modified. Android retains its original key. Different origins need a separate export/import path; not implemented yet. The service worker uses isolated cache names and an app-relative scope. Source snapshot had no standalone LICENSE file; do not infer an open-source licence. Camera, offline, speech and physical Android testing pending.
