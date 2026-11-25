# Blind Android

Installable APK with a native Java Activity hosting bundled WebView UI, native text-to-speech, clipboard, camera permissions and Android document picker/CSV export. Not a fully native UI rewrite. No internet permission is declared. Android and browser saved collections are separate.

Requires JDK 17, Gradle 8.9, Android SDK 35. Run `gradle -p android :app:assembleDebug` from the repository root. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Debug-signed for sideload testing, not Play Store release. Device testing is required.

## Durable testing previews

The monorepo Blind Android APK workflow has a manual `publish_preview` option, restricted to the main branch. The publishing job depends on a successful APK build/signature verification and uploads the debug APK plus SHA-256 checksum to a commit-specific GitHub prerelease. It never replaces existing assets. Debug signing keys are not persisted; different builds or the original APK may have incompatible signatures. Back up/export saved colours before considering uninstalling anything. These are testing previews only; a stable update path requires a secure persistent release-signing key and device validation. No credentials are stored in Git.
