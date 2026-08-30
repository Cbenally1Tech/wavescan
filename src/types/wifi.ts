export type SecurityType = 'Open' | 'WEP' | 'WPA' | 'WPA2' | 'WPA3' | 'WPA2/WPA3' | 'Unknown'

export interface WifiNetwork {
  id: string
  ssid: string
  bssid: string
  signal: number // 0–100 (higher is stronger)
  rssi: number // dBm
  frequency: number // MHz
  channel: number
  security: SecurityType
  connected?: boolean
}

export type ScanMode = 'native' | 'demo' | 'idle'

export interface ConnectionInfo {
  type: string
  downlink?: number
  rtt?: number
  effectiveType?: string
  saveData?: boolean
}

export interface ScanResult {
  networks: WifiNetwork[]
  mode: ScanMode
  scannedAt: number
  message?: string
}
