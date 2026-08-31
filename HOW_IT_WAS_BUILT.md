# How Globe Pins Was Built

A walkthrough for designers learning to code. This explains what the app does, how the pieces fit together, and the concepts behind those pieces.

---

## The big picture

Think of this app like a poster with two zones:

1. **A side panel** — search + a list of pinned places (the “UI chrome”)
2. **A stage** — the interactive 3D globe (the “visual”)

```
┌─────────────┬──────────────────────────┐
│  Search     │                          │
│  Pin list   │        3D Globe          │
│             │                          │
└─────────────┴──────────────────────────┘
```

When you type a city, we ask Mapbox “where is that?” and get coordinates back.  
When you click the globe, we ask Mapbox “what place is here?” and get a name back.  
Pins live in a list you can reorder and delete — and each pin also appears as a marker on the map.

---

## What tools we used (and why)

| Tool | Role | Design analogy |
| --- | --- | --- |
| **Vite** | Starts the project and serves it while you work | Like Figma’s live preview — changes show up fast |
| **React** | Builds the interface from reusable pieces | Components ≈ nested frames / instances |
| **TypeScript** | JavaScript with types (labels on data) | Like a design system: props have expected shapes |
| **Mapbox GL JS** | Draws the interactive 3D globe | The canvas / map engine |
| **Mapbox Geocoding API** | Turns text ↔ coordinates | “Find this address” / “Name this point” |
| **canvas-confetti** | Tiny celebration animation on click | A microinteraction library |
| **Geist** | The typeface | Brand typography, loaded as a font file |

You don’t need to memorize these. Notice the pattern: **UI framework + map library + APIs + styling**.

---

## Concepts explored

### 1. Components

A **component** is a reusable chunk of UI with its own logic and markup.

In this project:

- `Globe` — the map
- `SearchBar` — the search field + suggestions
- `PinList` — the list of pins
- `App` — the parent that holds everything together

In design terms: components are like symbols. `App` is the artboard; the others are instances placed inside it.

Data flows **down** through props (parent → child):

```
App
 ├─ pins (the list of saved places)
 ├─ SearchBar  → when you pick a result, tell App
 ├─ PinList    → when you delete/reorder/focus, tell App
 └─ Globe      → show pins; when you click, tell App
```

`App` owns the “source of truth.” Children don’t secretly keep their own conflicting pin lists.

---

### 2. State

**State** is data that can change over time, and when it changes, the UI redraws.

Examples here:

- What you’ve typed in search
- Whether suggestions are open
- The array of pinned places
- Which pin to fly the camera toward

Mental model:

> State is like design variables or prototype interactions — change a value, the screen updates.

The pin list lives in a small custom hook (`usePins`). A **hook** is just a reusable bundle of state + actions (`add`, `delete`, `reorder`). Hooks let you keep logic tidy without stuffing everything into one giant file.

---

### 3. APIs and geocoding

An **API** is a way for your app to ask another service for data over the internet.

Mapbox gives us two related ideas:

| Kind | Question | Used for |
| --- | --- | --- |
| **Forward geocoding** | “Paris” → lat/lng | Search field |
| **Reverse geocoding** | lat/lng → “Paris, France” | Clicking the globe to name a pin |

So search is “words → location.”  
Click-to-pin is “location → words.”

Both return structured results (name, full place label, longitude, latitude). We turn those into **pins** — small objects our app understands:

```ts
{
  id: "...",
  name: "Paris",
  placeName: "Paris, France",
  lng: 2.35,
  lat: 48.85
}
```

That object shape is a **type** — a contract for what a pin must include. Types help catch mistakes early (like forgetting coordinates).

---

### 4. The map as an interactive canvas

Mapbox isn’t a static image. It’s a live WebGL scene you can:

- zoom
- rotate / orbit
- pan
- click

We set `projection: 'globe'` so it reads as a sphere instead of a flat map. Fog/atmosphere settings make space feel dimensional — similar to lighting a 3D mock.

**Markers** are DOM elements (little numbered dots) glued to geographic coordinates. When the pin list changes, we sync markers:

- new pin → add marker  
- deleted pin → remove marker  
- reordered list → update the numbers  

Clicking the map also triggers **confetti** near the cursor — a microinteraction that rewards exploration without changing the core task.

---

### 5. Lists, identity, and reordering

Each pin has a unique `id`. That matters because React needs a stable identity for list items (not just “item #2”), especially when you reorder.

Reordering uses **drag and drop**:

1. Remember which index you started dragging  
2. On drop, move that item to the new index  
3. Update state → list and map markers refresh  

Delete is simpler: filter the array to remove one id.

Design parallel: reordering layers in a panel — same mental model, different medium.

---

### 6. Styling system (almost black & white)

We kept the visual language intentional and small:

- **Base type size:** `16px` = `1rem` / `1em`
- **Limited hierarchy:** roughly three sizes (13 / 14 / 16–18px)
- **Palette:** near-white surfaces, near-black ink, one muted gray, hairline borders
- **Typeface:** Geist (variable font), loaded locally

CSS variables (`--ink`, `--muted`, `--text-base`, …) act like design tokens. Change them in one place; the UI follows.

Layout uses **CSS Grid**:

- Desktop: sidebar + globe side by side  
- Narrow screens: stack panel above map  

No card-heavy dashboard. The panel is structure; the globe is the hero.

---

### 7. Environment variables (secrets)

The Mapbox token isn’t hard-coded into the source. It lives in a `.env` file:

```env
VITE_MAPBOX_TOKEN=pk.your_token_here
```

Why:

- Tokens are credentials
- Different people / machines can use different tokens
- You can share the code without sharing the key

`.env.example` is the template. `.env` stays private (gitignored).

---

## How a typical interaction flows

### Searching and pinning

1. You type “Lisbon”
2. After a short pause (debounce), we call Mapbox search
3. Suggestions appear under the field
4. You click one
5. `App` adds a pin to state
6. `PinList` shows it; `Globe` adds a marker and flies toward it

### Clicking the globe

1. You click a point on Earth
2. Confetti bursts at the cursor
3. We reverse-geocode that point
4. A new pin is added with a human-readable label

### Editing the list

1. Drag a row → order in state changes  
2. Click **Delete** → pin removed from state and map  
3. Click a pin name → camera focuses that place  

Same state, many views. That’s the core React idea.

---

## File map (what to open first)

```
src/
  App.tsx                 → wires everything together
  App.css / index.css     → visual system
  components/
    Globe.tsx             → Mapbox + confetti + markers
    SearchBar.tsx         → search UI + suggestions
    PinList.tsx           → list, delete, drag reorder
  hooks/usePins.ts        → pin state and actions
  lib/geocoding.ts        → talking to Mapbox’s place API
  types.ts                → what a “Pin” is
```

If you’re learning, start with `App.tsx`, then open one component at a time. Trace one user action end-to-end (search → pin → marker).

---

## Ideas you practiced without naming them

These show up constantly in product engineering:

- **Separation of concerns** — map logic ≠ search UI ≠ list UI  
- **Single source of truth** — pins live in one place  
- **Async work** — waiting for network answers (`fetch`, loading, errors)  
- **Debouncing** — don’t search on every keystroke; wait briefly  
- **Accessibility basics** — labels, listbox roles, keyboard-focusable controls  
- **Responsive layout** — one composition that still works on small screens  
- **Microinteraction** — confetti as feedback, not decoration for its own sake  

---

## A designer-friendly mental model

| Design | Code in this project |
| --- | --- |
| Artboard | `App` |
| Components / symbols | `Globe`, `SearchBar`, `PinList` |
| Overrides / props | `pins`, `onSelect`, `onDelete` |
| Variables / tokens | CSS custom properties |
| Prototype interactions | State updates + event handlers |
| External plugin (maps) | Mapbox |
| Content from a CMS/API | Geocoding responses |

You’re not learning a totally foreign language — you’re learning a more explicit way to describe systems you already design.

---

## What to try next (learning path)

1. Change colors or type scale in `index.css` — see tokens cascade  
2. Change confetti colors or amount in `Globe.tsx`  
3. Add a second button on a pin row (e.g. “Copy coordinates”)  
4. Limit pins to 10 and show a quiet message when full  
5. Swap the Mapbox style (light → another style URL) and study the mood shift  

Small edits teach faster than reading alone.

---

## Glossary

- **Component** — reusable UI piece  
- **State** — data that changes and triggers a re-render  
- **Props** — inputs passed into a component  
- **Hook** — reusable stateful logic (`useState`, `usePins`, …)  
- **API** — request/response interface to another service  
- **Geocoding** — converting between place names and coordinates  
- **Debounce** — wait until typing pauses before acting  
- **Token (design)** — shared style value (color, type size)  
- **Token (API)** — secret key that authorizes requests  

---

Built as a scaffold: intentionally small, readable, and close to how real product UI is structured — so you can grow it without throwing it away.
