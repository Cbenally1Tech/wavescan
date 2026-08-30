import { useState, useTransition } from 'react'
import { ScanRadar } from './components/ScanRadar'
import { NetworkDetail, NetworkList } from './components/NetworkList'
import { DeviceDetail, DeviceList } from './components/DeviceList'
import { getConnectionInfo, scanWifi } from './services/wifiScan'
import { scanDevices } from './services/deviceScan'
import type { ScanMode, WifiNetwork } from './types/wifi'
import type { LanDevice } from './types/device'
import './App.css'

type Tab = 'wifi' | 'devices'

function formatTime(ts: number | null): string {
  if (!ts) return '—'
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(ts)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('wifi')

  const [networks, setNetworks] = useState<WifiNetwork[]>([])
  const [selectedNetId, setSelectedNetId] = useState<string | null>(null)
  const [wifiMode, setWifiMode] = useState<ScanMode>('idle')
  const [wifiMessage, setWifiMessage] = useState<string | null>(null)
  const [wifiScannedAt, setWifiScannedAt] = useState<number | null>(null)

  const [devices, setDevices] = useState<LanDevice[]>([])
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null)
  const [deviceMode, setDeviceMode] = useState<ScanMode>('idle')
  const [deviceMessage, setDeviceMessage] = useState<string | null>(null)
  const [deviceScannedAt, setDeviceScannedAt] = useState<number | null>(null)
  const [subnet, setSubnet] = useState<string | null>(null)

  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const connection = getConnectionInfo()

  const selectedNet = networks.find((n) => n.id === selectedNetId) ?? null
  const selectedDev = devices.find((d) => d.id === selectedDevId) ?? null
  const busy = scanning || isPending

  const mode = tab === 'wifi' ? wifiMode : deviceMode
  const message = tab === 'wifi' ? wifiMessage : deviceMessage
  const scannedAt = tab === 'wifi' ? wifiScannedAt : deviceScannedAt

  async function handleScan() {
    if (scanning) return
    setScanning(true)
    setError(null)

    try {
      if (tab === 'wifi') {
        setWifiMessage(null)
        const result = await scanWifi()
        startTransition(() => {
          setNetworks(result.networks)
          setWifiMode(result.mode)
          setWifiMessage(result.message ?? null)
          setWifiScannedAt(result.scannedAt)
          setSelectedNetId(result.networks[0]?.id ?? null)
        })
      } else {
        setDeviceMessage(null)
        const result = await scanDevices()
        startTransition(() => {
          setDevices(result.devices)
          setDeviceMode(result.mode)
          setDeviceMessage(result.message ?? null)
          setDeviceScannedAt(result.scannedAt)
          setSubnet(result.subnet ?? null)
          setSelectedDevId(result.devices[0]?.id ?? null)
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />

      <header className="top">
        <p className="brand">WaveScan</p>
        <p className="tagline">Wi‑Fi airwaves and LAN devices in one sweep</p>
      </header>

      <nav className="tabs" aria-label="Scanner mode">
        <button
          type="button"
          className={`tabs__btn ${tab === 'wifi' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('wifi')}
          aria-pressed={tab === 'wifi'}
        >
          Wi‑Fi
        </button>
        <button
          type="button"
          className={`tabs__btn ${tab === 'devices' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('devices')}
          aria-pressed={tab === 'devices'}
        >
          Devices
        </button>
      </nav>

      <main className="main">
        <section className="stage" aria-labelledby="scan-heading">
          <h1 id="scan-heading" className="visually-hidden">
            {tab === 'wifi' ? 'Scan nearby Wi‑Fi' : 'Scan LAN devices'}
          </h1>
          <ScanRadar scanning={busy} />
          <button
            type="button"
            className={`scan-btn ${busy ? 'scan-btn--busy' : ''}`}
            onClick={handleScan}
            disabled={busy}
            aria-busy={busy}
          >
            {busy
              ? 'Scanning…'
              : tab === 'wifi'
                ? 'Scan Wi‑Fi'
                : 'Scan Devices'}
          </button>
          <p className="stage__hint">
            {mode === 'demo' && 'Demo mode'}
            {mode === 'native' && 'Live device scan'}
            {mode === 'idle' && 'Ready'}
            {tab === 'devices' && subnet && (
              <>
                <span aria-hidden="true"> · </span>
                {subnet}
              </>
            )}
            <span aria-hidden="true"> · </span>
            Last sweep {formatTime(scannedAt)}
          </p>
        </section>

        <section className="link-status" aria-label="Current connection">
          <div>
            <span className="link-status__label">Link</span>
            <strong>{connection.type || 'unknown'}</strong>
          </div>
          <div>
            <span className="link-status__label">Speed class</span>
            <strong>{connection.effectiveType ?? '—'}</strong>
          </div>
          <div>
            <span className="link-status__label">Downlink</span>
            <strong>
              {connection.downlink != null ? `${connection.downlink} Mb/s` : '—'}
            </strong>
          </div>
        </section>

        {message && <p className="banner">{message}</p>}
        {error && <p className="banner banner--error">{error}</p>}

        {tab === 'wifi' ? (
          <section className="results" aria-labelledby="results-heading">
            <div className="results__head">
              <h2 id="results-heading">Networks</h2>
              <span className="results__count">{networks.length} found</span>
            </div>
            <NetworkList
              networks={networks}
              selectedId={selectedNetId}
              onSelect={setSelectedNetId}
            />
            <NetworkDetail network={selectedNet} />
          </section>
        ) : (
          <section className="results" aria-labelledby="devices-heading">
            <div className="results__head">
              <h2 id="devices-heading">Devices</h2>
              <span className="results__count">{devices.length} found</span>
            </div>
            <DeviceList
              devices={devices}
              selectedId={selectedDevId}
              onSelect={setSelectedDevId}
            />
            <DeviceDetail device={selectedDev} />
          </section>
        )}
      </main>

      <footer className="foot">
        <p>
          Browser preview uses demo data. Live Wi‑Fi and LAN device scans need a
          native shell (Capacitor) with the right permissions.
        </p>
      </footer>
    </div>
  )
}
