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
  onPinDelete?: (id: string) => void
}

export function Globe({ pins, focusPinId, onMapClick, onPinDelete }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const onMapClickRef = useRef(onMapClick)
  const onPinDeleteRef = useRef(onPinDelete)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    onPinDeleteRef.current = onPinDelete
  }, [onPinDelete])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

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

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(248, 248, 248)',
        'high-color': 'rgb(248, 248, 248)',
        'horizon-blend': 0.004,
        'space-color': 'rgb(248, 248, 248)',
        'star-intensity': 0,
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
    const markers = markersRef.current

    return () => {
      markers.forEach((marker) => marker.remove())
      markers.clear()
      map.remove()
      mapRef.current = null
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
        el.setAttribute('aria-label', `Remove pin ${pin.name}`)
        el.title = 'Click to remove'
        el.innerHTML = `<span class="map-pin__index">${index + 1}</span>`

        el.addEventListener('click', (event) => {
          event.stopPropagation()
          onPinDeleteRef.current?.(pin.id)
        })

        marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map)

        existing.set(pin.id, marker)
      } else {
        marker.setLngLat([pin.lng, pin.lat])
        const el = marker.getElement()
        el.setAttribute('aria-label', `Remove pin ${pin.name}`)
        const indexEl = el.querySelector('.map-pin__index')
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
