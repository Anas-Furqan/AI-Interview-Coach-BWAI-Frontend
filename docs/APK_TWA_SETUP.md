# APK Packaging Path (PWA + TWA)

## 1) PWA Baseline
- Deploy frontend on HTTPS (already: https://ai-interview-bwai.vercel.app).
- Keep `public/manifest.json` valid.
- Keep service worker strategy if you add offline support later.

## 2) Digital Asset Links
- Edit `public/.well-known/assetlinks.json`:
  - Replace `package_name` with your final Android package id.
  - Replace `REPLACE_WITH_RELEASE_SHA256_FINGERPRINT` with your signing cert SHA-256.
- After deploy, verify:
  - `https://ai-interview-bwai.vercel.app/.well-known/assetlinks.json`

## 3) Build TWA with Bubblewrap
Prerequisites:
- Java 17+
- Android SDK + build-tools
- Node.js

Commands:
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://ai-interview-bwai.vercel.app/manifest.json
bubblewrap build
```

## 4) Sign APK/AAB
If using your own keystore:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore android-release-key.jks app-release-unsigned.apk release
```

Then align:
```bash
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

## 5) Smoke checklist before upload
- App opens and loads login route.
- Audio playback works (TTS demo).
- Microphone permission prompt appears and STT fallback works.
- Deep links open directly in app (verified links).

## Notes
- This repo includes `twa-manifest.json` as a template.
- If Play Store requires AAB, use Bubblewrap AAB output flow.
