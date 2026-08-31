import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces, type GeocodeSuggestion } from '../lib/geocoding'

type SearchBarProps = {
  onSelect: (suggestion: GeocodeSuggestion) => void
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await searchPlaces(trimmed, controller.signal)
        setSuggestions(results)
        setOpen(true)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setSuggestions([])
        setError('Could not search places')
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  function handleSelect(suggestion: GeocodeSuggestion) {
    onSelect(suggestion)
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="search" ref={rootRef}>
      <label className="search__label" htmlFor="place-search">
        Search
      </label>
      <input
        id="place-search"
        className="search__input"
        type="search"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="City, address, or place"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
      />
      <div className="search__meta" aria-live="polite">
        {loading ? 'Searching…' : error ? error : '\u00A0'}
      </div>
      {open && suggestions.length > 0 && (
        <ul id={listId} className="search__results" role="listbox">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} role="option">
              <button
                type="button"
                className="search__result"
                onClick={() => handleSelect(suggestion)}
              >
                <span className="search__result-name">{suggestion.name}</span>
                <span className="search__result-place">{suggestion.placeName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
