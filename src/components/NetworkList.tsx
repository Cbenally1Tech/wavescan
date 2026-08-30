import type { WifiNetwork } from '../types/wifi'
import { bandLabel, signalLabel } from '../services/wifiScan'
import './NetworkList.css'

interface NetworkListProps {
  networks: WifiNetwork[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function SignalBars({ signal }: { signal: number }) {
  const level = signal >= 75 ? 4 : signal >= 50 ? 3 : signal >= 30 ? 2 : 1
  return (
    <div className="bars" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`bars__seg ${n <= level ? 'bars__seg--on' : ''} bars__seg--${n}`}
        />
      ))}
    </div>
  )
}

export function NetworkList({ networks, selectedId, onSelect }: NetworkListProps) {
  if (networks.length === 0) {
    return (
      <p className="networks-empty">
        No networks yet. Tap Scan to sweep the airwaves.
      </p>
    )
  }

  return (
    <ul className="networks" role="listbox" aria-label="Nearby Wi-Fi networks">
      {networks.map((net, index) => {
        const selected = net.id === selectedId
        return (
          <li key={net.id} style={{ animationDelay: `${index * 50}ms` }}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={`network ${selected ? 'network--selected' : ''}`}
              onClick={() => onSelect(net.id)}
            >
              <div className="network__main">
                <div className="network__title-row">
                  <span className="network__ssid">{net.ssid}</span>
                  {net.connected && <span className="network__badge">Connected</span>}
                </div>
                <div className="network__meta">
                  <span>{bandLabel(net.frequency)}</span>
                  <span aria-hidden="true">-</span>
                  <span>Ch {net.channel}</span>
                  <span aria-hidden="true">-</span>
                  <span>{net.security}</span>
                </div>
              </div>
              <div className="network__signal">
                <SignalBars signal={net.signal} />
                <span className="network__dbm">{net.rssi} dBm</span>
                <span className="network__quality">{signalLabel(net.signal)}</span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function NetworkDetail({ network }: { network: WifiNetwork | null }) {
  if (!network) return null

  return (
    <div className="detail" aria-live="polite">
      <h2 className="detail__ssid">{network.ssid}</h2>
      <dl className="detail__grid">
        <div>
          <dt>Signal</dt>
          <dd>
            {network.rssi} dBm - {signalLabel(network.signal)}
          </dd>
        </div>
        <div>
          <dt>Band</dt>
          <dd>
            {bandLabel(network.frequency)} - Ch {network.channel}
          </dd>
        </div>
        <div>
          <dt>Security</dt>
          <dd>{network.security}</dd>
        </div>
        <div>
          <dt>BSSID</dt>
          <dd className="detail__mono">{network.bssid}</dd>
        </div>
      </dl>
    </div>
  )
}
