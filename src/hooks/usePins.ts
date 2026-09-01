import { useCallback, useState } from 'react'
import type { Pin } from '../types'
import type { GeocodeSuggestion } from '../lib/geocoding'

function createId() {
  return crypto.randomUUID()
}

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([])

  const addPin = useCallback((suggestion: GeocodeSuggestion) => {
    setPins((prev) => {
      if (prev.some((p) => p.lng === suggestion.lng && p.lat === suggestion.lat)) {
        return prev
      }
      return [
        ...prev,
        {
          id: createId(),
          name: suggestion.name,
          placeName: suggestion.placeName,
          lng: suggestion.lng,
          lat: suggestion.lat,
        },
      ]
    })
  }, [])

  const addPinFromCoords = useCallback(
    (pin: Omit<Pin, 'id'>) => {
      setPins((prev) => [
        ...prev,
        {
          id: createId(),
          ...pin,
        },
      ])
    },
    [],
  )

  const removePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearPins = useCallback(() => {
    setPins([])
  }, [])

  const reorderPins = useCallback((fromIndex: number, toIndex: number) => {
    setPins((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev
      }
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  return { pins, addPin, addPinFromCoords, removePin, clearPins, reorderPins }
}
