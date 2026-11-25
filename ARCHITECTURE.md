# Architecture

Static root portal uses a JSON registry, relative links and native browser modules. Application modules live in apps/ and remain independent. Shared styling lives in packages/ui/. Static deploy stages only public portal files and explicitly approved static app paths. Backend modules will be deployed only on verified free infrastructure, with independent service boundaries. Browser storage and service worker scopes must be isolated per app.
