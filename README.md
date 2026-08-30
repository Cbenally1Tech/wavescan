# WaveScan

Mobile-first scanner PWA with two modes:

- **Wi‑Fi** — nearby networks, signal, band, channel, security
- **Devices** — LAN hosts on your subnet (IP, MAC, vendor, type)

## What works where

| Environment | Behavior |
|---|---|
| Browser / PWA preview | Demo Wi‑Fi + LAN device scans (browsers cannot ARP-scan or list SSIDs) |
| Android via Capacitor + plugins | Live radio / LAN scans (permissions required) |
| Current link strip | Uses the Network Information API when the browser exposes it |
| Device “this device” IP | Best-effort via WebRTC ICE when available |

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
