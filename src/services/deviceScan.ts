import type { DeviceKind, DeviceScanResult, LanDevice } from '../types/device'

const DEMO_POOL: Array<Omit<LanDevice, 'id' | 'ip' | 'mac' | 'isSelf' | 'isGateway'>> = [
  { name: 'Living-Room-TV', vendor: 'Samsung', kind: 'tv' },
  { name: 'MacBook-Pro', vendor: 'Apple', kind: 'laptop' },
  { name: 'Pixel-8', vendor: 'Google', kind: 'phone' },
  { name: 'Home-Printer', vendor: 'HP', kind: 'printer' },
  { name: 'Nest-Mini', vendor: 'Google', kind: 'speaker' },
  { name: 'iPad-Air', vendor: 'Apple', kind: 'tablet' },
  { name: 'Ring-Doorbell', vendor: 'Amazon', kind: 'iot' },
  { name: 'Office-PC', vendor: 'Dell', kind: 'desktop' },
  { name: 'Echo-Dot', vendor: 'Amazon', kind: 'speaker' },
  { name: 'Steam-Deck', vendor: 'Valve', kind: 'tablet' },
  { name: 'Chromecast', vendor: 'Google', kind: 'tv' },
  { name: 'Smart-Plug', vendor: 'TP-Link', kind: 'iot' },
]

function randomMac(oui?: string): string {
  const head = oui ?? Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join(':')
  const tail = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join(':')
  return `${head}:${tail}`
}

function parseSubnet(ip: string): { base: string; selfHost: number } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(ip)
  if (!m) return null
  return {
    base: `${m[1]}.${m[2]}.${m[3]}`,
    selfHost: Number(m[4]),
  }
}

/** Best-effort local IPv4 via WebRTC ICE (works in many browsers). */
export async function discoverLocalIp(): Promise<string | undefined> {
  if (typeof RTCPeerConnection === 'undefined') return undefined

  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] })
    let done = false
    const finish = (ip?: string) => {
      if (done) return
      done = true
      try {
        pc.close()
      } catch {
        /* ignore */
      }
      resolve(ip)
    }

    const timer = window.setTimeout(() => finish(undefined), 1800)

    pc.createDataChannel('wavescan')
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => finish(undefined))

    pc.onicecandidate = (event) => {
      const cand = event.candidate?.candidate
      if (!cand) return
      const match = /(?:udp|tcp)\s+\d+\s+([0-9.]+)\s/i.exec(cand)
      const ip = match?.[1]
      if (ip && !ip.startsWith('127.') && !ip.includes(':')) {
        window.clearTimeout(timer)
        finish(ip)
      }
    }
  })
}

async function tryNativeDeviceScan(): Promise<LanDevice[] | null> {
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> }
    }
  ).Capacitor

  if (!cap?.isNativePlatform?.()) return null

  const plugin = cap.Plugins?.NetworkScanner as
    | {
        scan?: () => Promise<{ devices?: Array<Record<string, unknown>> }>
      }
    | undefined

  if (!plugin?.scan) return null

  try {
    const result = await plugin.scan()
    const raw = result.devices ?? []
    return raw.map((d, i) => ({
      id: String(d.id ?? d.ip ?? `dev-${i}`),
      name: String(d.name ?? d.hostname ?? `Device ${i + 1}`),
      ip: String(d.ip ?? '0.0.0.0'),
      mac: String(d.mac ?? d.bssid ?? '—'),
      vendor: String(d.vendor ?? 'Unknown'),
      kind: (String(d.kind ?? 'unknown') as DeviceKind) || 'unknown',
      isSelf: Boolean(d.isSelf),
      isGateway: Boolean(d.isGateway),
    }))
  } catch {
    return null
  }
}

function buildDemoDevices(localIp?: string): LanDevice[] {
  const subnet = localIp ? parseSubnet(localIp) : null
  const base = subnet?.base ?? `192.168.${1 + Math.floor(Math.random() * 3)}`
  const selfHost = subnet?.selfHost ?? 40 + Math.floor(Math.random() * 80)
  const gatewayHost = 1

  const count = 6 + Math.floor(Math.random() * 5)
  const shuffled = [...DEMO_POOL].sort(() => Math.random() - 0.5).slice(0, count)

  const usedHosts = new Set<number>([selfHost, gatewayHost])
  const pickHost = () => {
    let h = 2 + Math.floor(Math.random() * 250)
    while (usedHosts.has(h)) h = 2 + Math.floor(Math.random() * 250)
    usedHosts.add(h)
    return h
  }

  const gateway: LanDevice = {
    id: `gw-${base}.1`,
    name: 'Gateway',
    ip: `${base}.${gatewayHost}`,
    mac: randomMac('a4:2b:b0'),
    vendor: 'Router',
    kind: 'router',
    isGateway: true,
  }

  const self: LanDevice = {
    id: `self-${base}.${selfHost}`,
    name: 'This device',
    ip: `${base}.${selfHost}`,
    mac: randomMac(),
    vendor: 'You',
    kind: 'phone',
    isSelf: true,
  }

  const others: LanDevice[] = shuffled.map((d, i) => {
    const host = pickHost()
    return {
      ...d,
      id: `${d.name}-${host}-${Date.now()}-${i}`,
      ip: `${base}.${host}`,
      mac: randomMac(),
    }
  })

  return [gateway, self, ...others].sort((a, b) => {
    const ah = Number(a.ip.split('.').pop())
    const bh = Number(b.ip.split('.').pop())
    return ah - bh
  })
}

export async function scanDevices(): Promise<DeviceScanResult> {
  const localIp = await discoverLocalIp()
  const native = await tryNativeDeviceScan()

  if (native && native.length > 0) {
    return {
      devices: native,
      mode: 'native',
      scannedAt: Date.now(),
      localIp,
      subnet: localIp ? `${parseSubnet(localIp)?.base}.0/24` : undefined,
      message: 'Live LAN scan from the device network stack',
    }
  }

  await new Promise((r) => setTimeout(r, 1600 + Math.random() * 1000))

  const devices = buildDemoDevices(localIp)
  return {
    devices,
    mode: 'demo',
    scannedAt: Date.now(),
    localIp: devices.find((d) => d.isSelf)?.ip ?? localIp,
    subnet: localIp
      ? `${parseSubnet(localIp)?.base}.0/24`
      : `${devices[0]?.ip.split('.').slice(0, 3).join('.')}.0/24`,
    message:
      'Demo LAN scan — browsers cannot ARP-scan your subnet. Wrap with Capacitor for live device discovery.',
  }
}

export function kindLabel(kind: DeviceKind): string {
  const labels: Record<DeviceKind, string> = {
    phone: 'Phone',
    tablet: 'Tablet',
    laptop: 'Laptop',
    desktop: 'Desktop',
    router: 'Router',
    tv: 'TV',
    speaker: 'Speaker',
    printer: 'Printer',
    iot: 'IoT',
    unknown: 'Device',
  }
  return labels[kind]
}
