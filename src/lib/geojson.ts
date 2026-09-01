import type { Pin } from '../types'

export type PinFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: {
      id: string
      name: string
      placeName: string
      order: number
    }
  }>
}

export function pinsToGeoJSON(pins: Pin[]): PinFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map((pin, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [pin.lng, pin.lat],
      },
      properties: {
        id: pin.id,
        name: pin.name,
        placeName: pin.placeName,
        order: index + 1,
      },
    })),
  }
}

export function pinsToGeoJSONString(pins: Pin[], pretty = true): string {
  return JSON.stringify(pinsToGeoJSON(pins), null, pretty ? 2 : 0)
}
