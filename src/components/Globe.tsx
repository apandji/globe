import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import confetti from 'canvas-confetti'
import 'mapbox-gl/dist/mapbox-gl.css'
import { pinsToGeoJSON } from '../lib/geojson'
import { getMapboxToken } from '../lib/geocoding'
import type { Pin } from '../types'

const PINS_SOURCE = 'pins'
const PINS_CIRCLE_LAYER = 'pins-circle'
const PINS_LABEL_LAYER = 'pins-label'

type GlobeProps = {
  pins: Pin[]
  focusPinId?: string | null
  onMapClick?: (lng: number, lat: number, point: { x: number; y: number }) => void
  onPinDelete?: (id: string) => void
}

export function Globe({ pins, focusPinId, onMapClick, onPinDelete }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const pinsRef = useRef(pins)
  const layersReadyRef = useRef(false)
  const hoveredPinIdRef = useRef<string | null>(null)
  const onMapClickRef = useRef(onMapClick)
  const onPinDeleteRef = useRef(onPinDelete)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    onPinDeleteRef.current = onPinDelete
  }, [onPinDelete])

  useEffect(() => {
    pinsRef.current = pins
  }, [pins])

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

    const setupPinLayers = () => {
      if (layersReadyRef.current) return

      map.addSource(PINS_SOURCE, {
        type: 'geojson',
        data: pinsToGeoJSON([]),
        promoteId: 'id',
      })

      map.addLayer({
        id: PINS_CIRCLE_LAYER,
        type: 'circle',
        source: PINS_SOURCE,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1,
            9,
            4,
            12,
            8,
            14,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#b42318',
            '#111111',
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#111111',
          'circle-pitch-alignment': 'map',
          'circle-pitch-scale': 'map',
        },
      })

      map.addLayer({
        id: PINS_LABEL_LAYER,
        type: 'symbol',
        source: PINS_SOURCE,
        layout: {
          'text-field': ['to-string', ['get', 'order']],
          'text-size': 12,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-pitch-alignment': 'map',
          'text-rotation-alignment': 'map',
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      map.on('mouseenter', PINS_CIRCLE_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mousemove', PINS_CIRCLE_LAYER, (event) => {
        const feature = event.features?.[0] as
          | { properties?: { id?: string } }
          | undefined
        const id = feature?.properties?.id
        if (!id || hoveredPinIdRef.current === id) return

        if (hoveredPinIdRef.current) {
          map.setFeatureState(
            { source: PINS_SOURCE, id: hoveredPinIdRef.current },
            { hover: false },
          )
        }

        hoveredPinIdRef.current = id
        map.setFeatureState({ source: PINS_SOURCE, id }, { hover: true })
      })

      map.on('mouseleave', PINS_CIRCLE_LAYER, () => {
        map.getCanvas().style.cursor = ''

        if (hoveredPinIdRef.current) {
          map.setFeatureState(
            { source: PINS_SOURCE, id: hoveredPinIdRef.current },
            { hover: false },
          )
          hoveredPinIdRef.current = null
        }
      })

      map.on('click', PINS_CIRCLE_LAYER, (event) => {
        const feature = event.features?.[0] as
          | { properties?: { id?: string } }
          | undefined
        const id = feature?.properties?.id
        if (id) onPinDeleteRef.current?.(id)
      })

      layersReadyRef.current = true

      const source = map.getSource(PINS_SOURCE) as mapboxgl.GeoJSONSource
      source.setData(pinsToGeoJSON(pinsRef.current))
    }

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(248, 248, 248)',
        'high-color': 'rgb(248, 248, 248)',
        'horizon-blend': 0.004,
        'space-color': 'rgb(248, 248, 248)',
        'star-intensity': 0,
      })
      setupPinLayers()
    })

    map.on('click', (event) => {
      const hitPin = map.queryRenderedFeatures(event.point, {
        layers: [PINS_CIRCLE_LAYER],
      }).length

      if (hitPin > 0) return

      const { x, y } = event.point
      const cursor = getCursorViewportPoint(event, containerRef.current)

      confetti({
        particleCount: 64,
        spread: 58,
        startVelocity: 28,
        gravity: 0.9,
        ticks: 140,
        scalar: 0.9,
        colors: ['#111111', '#ffffff', '#888888', '#dddddd'],
        origin: {
          x: cursor.x / window.innerWidth,
          y: cursor.y / window.innerHeight,
        },
      })

      onMapClickRef.current?.(event.lngLat.lng, event.lngLat.lat, { x, y })
    })

    mapRef.current = map

    return () => {
      layersReadyRef.current = false
      hoveredPinIdRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !layersReadyRef.current) return

    const source = map.getSource(PINS_SOURCE) as mapboxgl.GeoJSONSource | undefined
    source?.setData(pinsToGeoJSON(pins))
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

function getCursorViewportPoint(
  event: mapboxgl.MapMouseEvent,
  container: HTMLDivElement | null,
) {
  const original = event.originalEvent as MouseEvent | TouchEvent

  if ('clientX' in original) {
    return { x: original.clientX, y: original.clientY }
  }

  const touch = original.touches[0] ?? original.changedTouches[0]
  if (touch) {
    return { x: touch.clientX, y: touch.clientY }
  }

  const rect = container?.getBoundingClientRect()
  if (rect) {
    return {
      x: rect.left + event.point.x,
      y: rect.top + event.point.y,
    }
  }

  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}
