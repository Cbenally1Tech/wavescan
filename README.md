# WaveScan

Mobile-first Wi‑Fi scanner PWA. Tap **Scan Wi‑Fi** to sweep for nearby networks, inspect signal strength, band, channel, and security.

## What works where

| Environment | Behavior |
|---|---|
| Browser / PWA preview | Demo scan with realistic SSIDs (browsers cannot list nearby Wi‑Fi) |
| Android via Capacitor + Wi‑Fi plugin | Live radio scan (location permission required) |
| Current link strip | Uses the Network Information API when the browser exposes it |

## Develop

```bash
npm install
npm run dev
```

Open the local URL on your phone (same network) or use Chrome device emulation.

```bash
npm run build
npm run preview
```

## Install as an app

Build, deploy the `dist/` folder (or run preview), then “Add to Home Screen” on mobile. The Vite PWA plugin ships a standalone manifest.

## Live Android scans

Browsers block SSID scanning for privacy. For real scans:

1. Wrap this app with [Capacitor](https://capacitorjs.com/).
2. Add a Wi‑Fi community plugin that exposes `Wifi.scan()` (or equivalent).
3. Request location / nearby Wi‑Fi permissions on Android 6+.

`src/services/wifiScan.ts` already probes `Capacitor.Plugins.Wifi` when running inside a native shell and falls back to demo mode on the web.

## Stack

- Vite + React + TypeScript
- Installable PWA (`vite-plugin-pwa`)
- No backend required
