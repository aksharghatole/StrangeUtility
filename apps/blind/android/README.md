# Blind Android

Installable APK with a native Java Activity hosting bundled WebView UI, native text-to-speech, clipboard, camera permissions and Android document picker/CSV export. Not a fully native UI rewrite. No internet permission is declared. Android and browser saved collections are separate.

Requires JDK 17, Gradle 8.9, Android SDK 35. Run `gradle -p android :app:assembleDebug` from the repository root. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Debug-signed for sideload testing, not Play Store release. Device testing is required.
