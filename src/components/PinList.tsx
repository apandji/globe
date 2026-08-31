import { useRef, useState } from 'react'
import type { Pin } from '../types'

type PinListProps = {
  pins: Pin[]
  onDelete: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onFocus: (id: string) => void
}

export function PinList({ pins, onDelete, onReorder, onFocus }: PinListProps) {
  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  if (pins.length === 0) {
    return (
      <p className="pin-list__empty">
        No pins yet. Search above, or click the globe to drop one.
      </p>
    )
  }

  return (
    <ul className="pin-list">
      {pins.map((pin, index) => (
        <li
          key={pin.id}
          className={
            overIndex === index ? 'pin-list__item is-over' : 'pin-list__item'
          }
          draggable
          onDragStart={() => {
            dragIndex.current = index
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setOverIndex(index)
          }}
          onDragLeave={() => {
            setOverIndex((current) => (current === index ? null : current))
          }}
          onDrop={(e) => {
            e.preventDefault()
            const from = dragIndex.current
            if (from !== null) onReorder(from, index)
            dragIndex.current = null
            setOverIndex(null)
          }}
          onDragEnd={() => {
            dragIndex.current = null
            setOverIndex(null)
          }}
        >
          <button
            type="button"
            className="pin-list__handle"
            aria-label={`Reorder ${pin.name}`}
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            className="pin-list__body"
            onClick={() => onFocus(pin.id)}
          >
            <span className="pin-list__index">{index + 1}</span>
            <span className="pin-list__copy">
              <span className="pin-list__name">{pin.name}</span>
              <span className="pin-list__place">{pin.placeName}</span>
            </span>
          </button>
          <button
            type="button"
            className="pin-list__delete"
            aria-label={`Delete ${pin.name}`}
            onClick={() => onDelete(pin.id)}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
