import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import confetti from 'canvas-confetti'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getMapboxToken } from '../lib/geocoding'
import type { Pin } from '../types'

type GlobeProps = {
  pins: Pin[]
  focusPinId?: string | null
  onMapClick?: (lng: number, lat: number, point: { x: number; y: number }) => void
}

export function Globe({ pins, focusPinId, onMapClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const onMapClickRef = useRef(onMapClick)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    try {
      mapboxgl.accessToken = getMapboxToken()
    } catch (err) {
      console.error(err)
      return
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'globe',
      zoom: 1.4,
      center: [10, 20],
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(250, 250, 250)',
        'high-color': 'rgb(220, 220, 220)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(18, 18, 18)',
        'star-intensity': 0.4,
      })
    })

    map.on('click', (e) => {
      const { x, y } = e.point
      const originX = x / window.innerWidth
      const originY = y / window.innerHeight

      confetti({
        particleCount: 64,
        spread: 58,
        startVelocity: 28,
        gravity: 0.9,
        ticks: 140,
        scalar: 0.9,
        colors: ['#111111', '#ffffff', '#888888', '#dddddd'],
        origin: { x: originX, y: originY },
      })

      onMapClickRef.current?.(e.lngLat.lng, e.lngLat.lat, { x, y })
    })

    mapRef.current = map

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
      void cancelled
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const existing = markersRef.current
    const nextIds = new Set(pins.map((p) => p.id))

    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    })

    pins.forEach((pin, index) => {
      let marker = existing.get(pin.id)
      if (!marker) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'map-pin'
        el.setAttribute('aria-label', pin.name)
        el.innerHTML = `<span class="map-pin__index">${index + 1}</span>`

        marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
              `<strong>${escapeHtml(pin.name)}</strong><div>${escapeHtml(pin.placeName)}</div>`,
            ),
          )
          .addTo(map)

        existing.set(pin.id, marker)
      } else {
        marker.setLngLat([pin.lng, pin.lat])
        const indexEl = marker.getElement().querySelector('.map-pin__index')
        if (indexEl) indexEl.textContent = String(index + 1)
      }
    })
  }, [pins])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusPinId) return
    const pin = pins.find((p) => p.id === focusPinId)
    if (!pin) return

    map.flyTo({
      center: [pin.lng, pin.lat],
      zoom: Math.max(map.getZoom(), 5),
      essential: true,
      duration: 1600,
    })
  }, [focusPinId, pins])

  return <div ref={containerRef} className="globe" role="presentation" />
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
