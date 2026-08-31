import type { Pin } from '../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export type GeocodeSuggestion = {
  id: string
  name: string
  placeName: string
  lng: number
  lat: number
}

export function getMapboxToken(): string {
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('your_mapbox_token')) {
    throw new Error(
      'Missing VITE_MAPBOX_TOKEN. Copy .env.example to .env and add your Mapbox token.',
    )
  }
  return MAPBOX_TOKEN
}

/** Forward geocode: text → places (cities, addresses, etc.) */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeSuggestion[]> {
  const token = getMapboxToken()
  const trimmed = query.trim()
  if (!trimmed) return []

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
  )
  url.searchParams.set('access_token', token)
  url.searchParams.set('autocomplete', 'true')
  url.searchParams.set('limit', '5')
  url.searchParams.set('types', 'place,locality,neighborhood,address,poi')

  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`)
  }

  const data = (await res.json()) as {
    features: Array<{
      id: string
      text: string
      place_name: string
      center: [number, number]
    }>
  }

  return data.features.map((f) => ({
    id: f.id,
    name: f.text,
    placeName: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }))
}

/** Reverse geocode: coordinates → place label */
export async function reverseGeocode(
  lng: number,
  lat: number,
): Promise<Pick<Pin, 'name' | 'placeName'>> {
  const token = getMapboxToken()
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
  )
  url.searchParams.set('access_token', token)
  url.searchParams.set('limit', '1')

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed (${res.status})`)
  }

  const data = (await res.json()) as {
    features: Array<{ text: string; place_name: string }>
  }

  const feature = data.features[0]
  if (!feature) {
    return {
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      placeName: 'Unknown location',
    }
  }

  return { name: feature.text, placeName: feature.place_name }
}
