import type {
  ConnectionInfo,
  ScanResult,
  SecurityType,
  WifiNetwork,
} from '../types/wifi'

const DEMO_SSIDS = [
  'Home-Mesh-5G',
  'Cafe_Guest',
  'Pixel_Hotspot',
  'NETGEAR-AX',
  'Apartment_2B',
  'Library_Public',
  'IoT-Hub',
  'Office-Secure',
  'Neighbor_WiFi',
  'Printer_Setup',
  'TP-Link_Extender',
  'Stadium_Free',
]

const SECURITIES: SecurityType[] = [
  'Open',
  'WPA2',
  'WPA3',
  'WPA2/WPA3',
  'WPA',
  'Unknown',
]

function parseSecurity(raw: string): SecurityType {
  const s = raw.toUpperCase()
  if (s.includes('WPA3') && s.includes('WPA2')) return 'WPA2/WPA3'
  if (s.includes('WPA3')) return 'WPA3'
  if (s.includes('WPA2')) return 'WPA2'
  if (s.includes('WPA')) return 'WPA'
  if (s.includes('WEP')) return 'WEP'
  if (s.includes('ESS') || s.includes('OPEN') || s === '') return s.includes('ESS') ? 'Open' : 'Unknown'
  return 'Unknown'
}

function channelFromFrequency(freq: number): number {
  if (freq >= 5170) return Math.round((freq - 5000) / 5)
  if (freq >= 2412) return Math.round((freq - 2407) / 5)
  return 0
}

function rssiToPercent(rssi: number): number {
  // Typical usable range: -100 (weak) to -40 (strong)
  const clamped = Math.min(-40, Math.max(-100, rssi))
  return Math.round(((clamped + 100) / 60) * 100)
}

function randomBssid(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join(':')
}

function buildDemoNetworks(count = 8): WifiNetwork[] {
  const shuffled = [...DEMO_SSIDS].sort(() => Math.random() - 0.5)
  const networks: WifiNetwork[] = shuffled.slice(0, count).map((ssid, i) => {
    const band5 = Math.random() > 0.45
    const frequency = band5
      ? 5180 + Math.floor(Math.random() * 16) * 20
      : 2412 + Math.floor(Math.random() * 11) * 5
    const rssi = -45 - Math.floor(Math.random() * 50) - i * 2
    return {
      id: `${ssid}-${i}-${Date.now()}`,
      ssid,
      bssid: randomBssid(),
      rssi,
      signal: rssiToPercent(rssi),
      frequency,
      channel: channelFromFrequency(frequency),
      security: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
      connected: false,
    }
  })

  networks.sort((a, b) => b.signal - a.signal)
  if (networks[0]) networks[0].connected = true
  return networks
}

async function tryNativeScan(): Promise<WifiNetwork[] | null> {
  // Capacitor Community Wifi (or similar) when the app is wrapped as a native shell
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> }
    }
  ).Capacitor

  if (!cap?.isNativePlatform?.()) return null

  const wifi = cap.Plugins?.Wifi as
    | {
        scan?: () => Promise<{ networks?: Array<Record<string, unknown>> }>
        getSSIDs?: () => Promise<{ ssids?: string[] }>
      }
    | undefined

  if (!wifi) return null

  try {
    if (typeof wifi.scan === 'function') {
      const result = await wifi.scan()
      const raw = result.networks ?? []
      return raw
        .map((n, i) => {
          const rssi = Number(n.level ?? n.rssi ?? -70)
          const frequency = Number(n.frequency ?? 2437)
          const ssid = String(n.ssid ?? n.SSID ?? `Network ${i + 1}`)
          return {
            id: String(n.bssid ?? n.BSSID ?? `${ssid}-${i}`),
            ssid: ssid || '(hidden)',
            bssid: String(n.bssid ?? n.BSSID ?? '00:00:00:00:00:00'),
            rssi,
            signal: rssiToPercent(rssi),
            frequency,
            channel: channelFromFrequency(frequency),
            security: parseSecurity(String(n.capabilities ?? n.security ?? '')),
            connected: Boolean(n.connected),
          } satisfies WifiNetwork
        })
        .sort((a, b) => b.signal - a.signal)
    }
  } catch {
    return null
  }

  return null
}

export function getConnectionInfo(): ConnectionInfo {
  const nav = navigator as Navigator & {
    connection?: {
      type?: string
      effectiveType?: string
      downlink?: number
      rtt?: number
      saveData?: boolean
    }
  }
  const c = nav.connection
  if (!c) {
    return { type: 'unknown' }
  }
  return {
    type: c.type ?? 'unknown',
    effectiveType: c.effectiveType,
    downlink: c.downlink,
    rtt: c.rtt,
    saveData: c.saveData,
  }
}

export async function scanWifi(): Promise<ScanResult> {
  const native = await tryNativeScan()
  if (native && native.length > 0) {
    return {
      networks: native,
      mode: 'native',
      scannedAt: Date.now(),
      message: 'Live scan from device Wi-Fi radio',
    }
  }

  // Simulate radio dwell time so the UI feels like a real sweep
  await new Promise((r) => setTimeout(r, 1400 + Math.random() * 900))

  return {
    networks: buildDemoNetworks(7 + Math.floor(Math.random() * 4)),
    mode: 'demo',
    scannedAt: Date.now(),
    message:
      'Demo scan - browsers cannot access nearby SSIDs. Wrap with Capacitor + a Wi-Fi plugin for live Android scans.',
  }
}

export function bandLabel(frequency: number): string {
  if (frequency >= 5925) return '6 GHz'
  if (frequency >= 5000) return '5 GHz'
  if (frequency >= 2400) return '2.4 GHz'
  return `${frequency} MHz`
}

export function signalLabel(signal: number): string {
  if (signal >= 75) return 'Excellent'
  if (signal >= 50) return 'Good'
  if (signal >= 30) return 'Fair'
  return 'Weak'
}
