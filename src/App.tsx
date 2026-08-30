import { useState, useTransition } from 'react'
import { ScanRadar } from './components/ScanRadar'
import { NetworkDetail, NetworkList } from './components/NetworkList'
import {
  getConnectionInfo,
  scanWifi,
} from './services/wifiScan'
import type { ScanMode, WifiNetwork } from './types/wifi'
import './App.css'

function formatTime(ts: number | null): string {
  if (!ts) return '-'
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(ts)
}

export default function App() {
  const [networks, setNetworks] = useState<WifiNetwork[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [mode, setMode] = useState<ScanMode>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [scannedAt, setScannedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const connection = getConnectionInfo()

  const selected = networks.find((n) => n.id === selectedId) ?? null

  async function handleScan() {
    if (scanning) return
    setScanning(true)
    setError(null)
    setMessage(null)

    try {
      const result = await scanWifi()
      startTransition(() => {
        setNetworks(result.networks)
        setMode(result.mode)
        setMessage(result.message ?? null)
        setScannedAt(result.scannedAt)
        setSelectedId(result.networks[0]?.id ?? null)
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const busy = scanning || isPending

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />

      <header className="top">
        <p className="brand">WaveScan</p>
        <p className="tagline">Mobile Wi-Fi airwaves at a glance</p>
      </header>

      <main className="main">
        <section className="stage" aria-labelledby="scan-heading">
          <h1 id="scan-heading" className="visually-hidden">
            Scan nearby Wi-Fi
          </h1>
          <ScanRadar scanning={busy} />
          <button
            type="button"
            className={`scan-btn ${busy ? 'scan-btn--busy' : ''}`}
            onClick={handleScan}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Scanning...' : 'Scan Wi-Fi'}
          </button>
          <p className="stage__hint">
            {mode === 'demo' && 'Demo mode'}
            {mode === 'native' && 'Live device scan'}
            {mode === 'idle' && 'Ready'}
            <span aria-hidden="true"> - </span>
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
            <strong>{connection.effectiveType ?? '-'}</strong>
          </div>
          <div>
            <span className="link-status__label">Downlink</span>
            <strong>
              {connection.downlink != null ? `${connection.downlink} Mb/s` : '-'}
            </strong>
          </div>
        </section>

        {message && <p className="banner">{message}</p>}
        {error && <p className="banner banner--error">{error}</p>}

        <section className="results" aria-labelledby="results-heading">
          <div className="results__head">
            <h2 id="results-heading">Networks</h2>
            <span className="results__count">
              {networks.length} found
            </span>
          </div>
          <NetworkList
            networks={networks}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <NetworkDetail network={selected} />
        </section>
      </main>

      <footer className="foot">
        <p>
          Browser preview uses demo SSIDs. For real radio scans on Android,
          build with Capacitor and a Wi-Fi plugin (location permission required).
        </p>
      </footer>
    </div>
  )
}
