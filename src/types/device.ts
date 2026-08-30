export type DeviceKind =
  | 'phone'
  | 'tablet'
  | 'laptop'
  | 'desktop'
  | 'router'
  | 'tv'
  | 'speaker'
  | 'printer'
  | 'iot'
  | 'unknown'

export interface LanDevice {
  id: string
  name: string
  ip: string
  mac: string
  vendor: string
  kind: DeviceKind
  isSelf?: boolean
  isGateway?: boolean
}

export interface DeviceScanResult {
  devices: LanDevice[]
  mode: 'native' | 'demo' | 'idle'
  scannedAt: number
  localIp?: string
  subnet?: string
  message?: string
}
