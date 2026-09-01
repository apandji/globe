import { useCallback, useMemo, useState } from 'react'
import { Globe } from './components/Globe'
import { PinList } from './components/PinList'
import { SearchBar } from './components/SearchBar'
import { usePins } from './hooks/usePins'
import { reverseGeocode, type GeocodeSuggestion } from './lib/geocoding'
import './App.css'

function App() {
  const { pins, addPin, addPinFromCoords, removePin, reorderPins } = usePins()
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [tokenMissing] = useState(
    () =>
      !import.meta.env.VITE_MAPBOX_TOKEN ||
      String(import.meta.env.VITE_MAPBOX_TOKEN).includes('your_mapbox_token'),
  )

  const focusPinId = useMemo(() => {
    if (!focusKey) return null
    if (focusKey.startsWith('id:')) return focusKey.slice(3)
    if (focusKey.startsWith('coord:')) {
      const [, lng, lat] = focusKey.split(':')
      return (
        pins.find((p) => p.lng === Number(lng) && p.lat === Number(lat))?.id ??
        null
      )
    }
    return null
  }, [focusKey, pins])

  const onSelect = useCallback(
    (suggestion: GeocodeSuggestion) => {
      addPin(suggestion)
      setFocusKey(`coord:${suggestion.lng}:${suggestion.lat}`)
    },
    [addPin],
  )

  const handleMapClick = useCallback(
    async (lng: number, lat: number) => {
      try {
        const place = await reverseGeocode(lng, lat)
        addPinFromCoords({ ...place, lng, lat })
      } catch (err) {
        console.error(err)
        addPinFromCoords({
          name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          placeName: 'Pinned location',
          lng,
          lat,
        })
      }
      setFocusKey(`coord:${lng}:${lat}`)
    },
    [addPinFromCoords],
  )

  if (tokenMissing) {
    return (
      <div className="token-gate">
        <p className="brand">Globe Pins</p>
        <p>
          Add your Mapbox access token to <code>.env</code> as{' '}
          <code>VITE_MAPBOX_TOKEN</code> (local) or set{' '}
          <code>MAPBOX_TOKEN</code> on Vercel, then restart the dev server.
        </p>
        <p>
          Copy <code>.env.example</code> → <code>.env</code>. Create a token at{' '}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
          >
            mapbox.com
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="panel">
        <header className="panel__header">
          <p className="brand">Globe Pins</p>
          <p className="lede">Search places, pin them, reorder the list.</p>
        </header>

        <SearchBar onSelect={onSelect} />

        <section className="panel__pins" aria-label="Pinned locations">
          <h2 className="panel__section-title">Pinned</h2>
          <PinList
            pins={pins}
            onDelete={removePin}
            onReorder={reorderPins}
            onFocus={(id) => setFocusKey(`id:${id}`)}
          />
        </section>
      </aside>

      <main className="stage">
        <Globe
          pins={pins}
          focusPinId={focusPinId}
          onMapClick={handleMapClick}
        />
      </main>
    </div>
  )
}

export default App
