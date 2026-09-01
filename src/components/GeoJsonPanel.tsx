import { useMemo, useState } from 'react'
import type { Pin } from '../types'
import { pinsToGeoJSONString } from '../lib/geojson'

type GeoJsonPanelProps = {
  pins: Pin[]
}

export function GeoJsonPanel({ pins }: GeoJsonPanelProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const geojson = useMemo(() => pinsToGeoJSONString(pins), [pins])

  async function handleCopy() {
    await navigator.clipboard.writeText(geojson)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function handleDownload() {
    const blob = new Blob([geojson], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pins.geojson'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="geojson" aria-label="GeoJSON export">
      <div className="geojson__header">
        <h2 className="panel__section-title">GeoJSON</h2>
        {pins.length > 0 && (
          <div className="geojson__actions">
            <button
              type="button"
              className="geojson__action"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'Hide' : 'Show'}
            </button>
            <button type="button" className="geojson__action" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="geojson__action" onClick={handleDownload}>
              Download
            </button>
          </div>
        )}
      </div>

      {pins.length === 0 ? (
        <p className="geojson__empty">Pin locations to generate GeoJSON.</p>
      ) : open ? (
        <pre className="geojson__code">
          <code>{geojson}</code>
        </pre>
      ) : (
        <p className="geojson__summary">
          {pins.length} point{pins.length === 1 ? '' : 's'} ready to export.
        </p>
      )}
    </section>
  )
}
