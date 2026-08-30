import type { LanDevice } from '../types/device'
import { kindLabel } from '../services/deviceScan'
import './DeviceList.css'

interface DeviceListProps {
  devices: LanDevice[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function DeviceList({ devices, selectedId, onSelect }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <p className="devices-empty">
        No devices yet. Tap Scan Devices to probe the LAN.
      </p>
    )
  }

  return (
    <ul className="devices" role="listbox" aria-label="Devices on this network">
      {devices.map((dev, index) => {
        const selected = dev.id === selectedId
        return (
          <li key={dev.id} style={{ animationDelay: `${index * 45}ms` }}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={`device ${selected ? 'device--selected' : ''}`}
              onClick={() => onSelect(dev.id)}
            >
              <span className={`device__glyph device__glyph--${dev.kind}`} aria-hidden="true" />
              <div className="device__main">
                <div className="device__title-row">
                  <span className="device__name">{dev.name}</span>
                  {dev.isSelf && <span className="device__badge">You</span>}
                  {dev.isGateway && <span className="device__badge device__badge--gw">Gateway</span>}
                </div>
                <div className="device__meta">
                  <span>{kindLabel(dev.kind)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{dev.vendor}</span>
                </div>
              </div>
              <div className="device__addr">
                <span className="device__ip">{dev.ip}</span>
                <span className="device__mac">{dev.mac}</span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function DeviceDetail({ device }: { device: LanDevice | null }) {
  if (!device) return null

  return (
    <div className="device-detail" aria-live="polite">
      <h2 className="device-detail__name">{device.name}</h2>
      <dl className="device-detail__grid">
        <div>
          <dt>IP address</dt>
          <dd className="device-detail__mono">{device.ip}</dd>
        </div>
        <div>
          <dt>MAC</dt>
          <dd className="device-detail__mono">{device.mac}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{kindLabel(device.kind)}</dd>
        </div>
        <div>
          <dt>Vendor</dt>
          <dd>{device.vendor}</dd>
        </div>
      </dl>
    </div>
  )
}
