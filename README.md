# Globe Pins

Interactive Mapbox 3D globe with place search, pin management, and a click confetti microinteraction.

## Features

- **3D globe** — zoom, rotate, and pan with Mapbox GL JS (`projection: 'globe'`)
- **Confetti** — clicking the map fires a black-and-white confetti burst
- **Search** — Mapbox forward geocoding for cities, addresses, and places
- **Click-to-pin** — reverse geocoding labels a pin from map coordinates
- **Pin list** — delete pins and drag to reorder
- **UI** — minimal near-monochrome layout, Geist typeface, 16px base

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example and add a [Mapbox access token](https://account.mapbox.com/access-tokens/):

```bash
cp .env.example .env
```

```env
VITE_MAPBOX_TOKEN=pk.your_token_here
```

3. Start the dev server:

```bash
npm run dev
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start Vite dev server    |
| `npm run build`| Typecheck + production build |
| `npm run preview` | Preview production build |

## Notes

- Search uses Mapbox Geocoding API (forward). Map clicks use reverse geocoding to name pins.
- Keep your token private; do not commit `.env`.
