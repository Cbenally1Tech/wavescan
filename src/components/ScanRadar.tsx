import { useEffect, useRef } from 'react'
import './ScanRadar.css'

interface ScanRadarProps {
  scanning: boolean
  size?: number
}

export function ScanRadar({ scanning, size = 220 }: ScanRadarProps) {
  const sweepRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sweepRef.current
    if (!el) return
    el.style.animationPlayState = scanning ? 'running' : 'paused'
  }, [scanning])

  return (
    <div
      className={`radar ${scanning ? 'radar--live' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="radar__ring radar__ring--1" />
      <div className="radar__ring radar__ring--2" />
      <div className="radar__ring radar__ring--3" />
      <div className="radar__core" />
      <div className="radar__sweep" ref={sweepRef} />
      <div className="radar__blip radar__blip--a" />
      <div className="radar__blip radar__blip--b" />
      <div className="radar__blip radar__blip--c" />
    </div>
  )
}
