# Jyotish AI

An Angular frontend with local birth-chart calculations and city search. Spring Boot connects optional Ollama chat; optional browser storage retains a local session. No accounts, payments, or cross-device storage.

## Run

```bash
npm install
npm start
```

Open http://localhost:4200. Build for production with `npm run build`.

## Read the code

- `src/app/core/models/chat-message.model.ts`: typed message shape.
- `src/app/features/chat/chat-layout/`: messages, streaming replies, reset, responsive layout.
- `src/app/features/chat/sidebar/`: navigation and reading-flow guidance.
- `src/app/features/chat/chat-input/`: draft, keyboard handling, send, suggestions.
- `src/app/features/chat/message/`: user and assistant rendering.
- `src/app/app.routes.ts`: root route.
- `src/styles.css`: shared colors, interactions, reduced-motion support.

Enter sends, Shift+Enter adds a newline. While a reply is pending, sending is disabled. New Chat cancels a pending reply and clears the conversation. Chats survive refresh only when optional browser saving is enabled.

Angular disk caching is disabled to avoid a native cache crash on this machine. The dev server uses polling to avoid file-watcher limits.

## Astronomy engine

- `@kuntay/swisseph` 0.2.2: AGPL-3.0-or-later, wrapping Swiss Ephemeris 2.10.03 in browser WASM. Source: https://github.com/kuntayerkus/swisseph-wasm/tree/v0.2.2
- `@js-temporal/polyfill` 0.5.1: ISC. Source: https://github.com/js-temporal/temporal-polyfill
- The application is distributed under AGPL-3.0-or-later. See LICENSE and THIRD_PARTY_NOTICES.md. Build/start regenerate the downloadable corresponding-source archive; preserve the source links when deploying.

`AstrologyEngineService.calculateBirthChart(data)` accepts birth date/time, coordinates and IANA timezone. `EphemerisService` isolates the asynchronous WASM loader and all Swiss calls. The unmodified package ESM/WASM assets are copied to `vendor/swisseph`; no CDN or external ephemeris files are required.

Supported UTC years: 1700–2100. Both tropical and sidereal apparent geocentric longitudes come from the same built-in Moshier model. UTC is converted to UT1/TT using Swiss Ephemeris. Sidereal mode is standard Lahiri/Chitrapaksha (1), not True Citra (27). The displayed date-specific ayanamsha includes nutation to match the tropical-to-sidereal difference. Full precision is retained internally.

Sun, Moon, Mercury, Venus, Mars, Jupiter and Saturn have tropical/sidereal longitudes and Vedic signs/degrees. Moon nakshatra/pada uses only sidereal longitude. Rahu uses MEAN_NODE; Ketu is exactly opposite. Coordinates affect Lagna/houses but do not affect geocentric planet positions. Moshier is not the full Swiss/JPL data-file model. Lahiri Lagna and whole-sign houses use the birth coordinates. Vimshottari Mahadasha/Antardasha dates use an explicitly labeled 365.25-day year. Transits are not calculated. Optional Ollama chat interprets the calculated chart.

Time conversion validates calendar dates, time, coordinates, and IANA names. DST gaps and repeated local times are rejected rather than silently choosing an instant. Historical offsets use the runtime's IANA database; accuracy depends on its version and historical coverage. No assumption of IST, and no coordinate/timezone consistency lookup.

## Test and inspect

```bash
npm test
npm run build
```

To inspect your own input without adding a production test UI, save a JSON file with the five birth fields, then run:

```bash
JYOTISH_BIRTH_FILE=/absolute/path/to/birth.json npm test
```

The output includes the calculated chart. Do not commit private birth details. `testLongitude(311.5)` in `astrology.dev.ts` remains available for testing existing sidereal mapping utilities.

Tests cover all 12 zodiac, 27 nakshatra and 108 pada boundaries, normalization, Ketu opposition, explicit tropical-to-sidereal subtraction, UTC offsets/date rollover, DST rejection, historical timezone seconds, validation errors, supported ranges, 64 published native Swiss reference cases across four centuries, and opposition/equinox references. See `tests/fixtures/README.md` for sources and tolerances.

Angular disk caching remains disabled for the native cache crash previously encountered; dev-server polling avoids local watcher limits.

## Birth details in chat

Choose **Enter birth details** or send a question. The form asks for date, time, place label, coordinates, and IANA timezone. Calculate positions shows tropical and Lahiri sidereal results for seven planets plus Rahu/Ketu, ayanamsha and Moon nakshatra/pada. Edit birth details recalculates; Cancel keeps the previous result. New Chat clears all profile/results and messages. Input and calculation failures preserve the form. Optional browser saving is now available; see the Ollama section below. Only the typed place name is sent to the location provider; date and birth time stay local.

The chat route is lazy-loaded to keep astronomy dependencies out of the initial bundle. Temporal's known JSBI CommonJS dependency is explicitly allowed in the Angular build configuration.

## Birthplace lookup

Type a city/town and click **Find birthplace**, then choose the correct region/country. Open-Meteo's Geocoding API (GeoNames data) supplies latitude, longitude, and IANA timezone. No package or API key is needed. Editing the place clears old coordinates to prevent mismatched locations. Manual entry remains available when search fails. Searches time out after 10 seconds.

Provider documentation and attribution: https://open-meteo.com/en/docs/geocoding-api . The hosted free API is for non-commercial use; commercial deployment requires reviewing the provider's terms. City coordinates represent the matched settlement, not an exact hospital/street address.

## Frontend calculation foundation

The existing result includes expandable whole-sign house placements and nine Vimshottari Mahadashas, each with nine Antardashas. The first major period starts before birth when part of the Moon's nakshatra has elapsed; its subperiods retain their original start dates. The timeline spans one complete cycle from that major-period start. All period dates are UTC and end-exclusive. These are calculated periods, not event predictions.

Pure `house.util.ts` and `dasha.util.ts` keep the arithmetic separate from Angular and Swiss Ephemeris. Lagna is calculated by Swiss Ephemeris's sidereal house API with Lahiri mode. Houses for latitudes at or beyond 66° north/south remain explicitly unavailable in this version; other chart fields still work.

No new dependencies or backend were added. Accounts, cross-device saving and payments remain outside this phase. Hosted AI is configured through the accompanying Spring Boot service. Reference rules and test conventions are in `tests/fixtures/README.md`.

## Ollama chat and optional browser saving

A Spring Boot API now connects calculated charts and recent messages to Ollama. See `../backend/README.md` for startup, privacy, testing and hosting instructions. Restart the Angular server to activate the `/api` proxy. The result is AI-generated interpretation, not a verified prediction; the calculation engine remains deterministic.

Check “Save birth details and chat on this browser” to opt in. Delete saved data removes the saved session and clears the screen. This phase has no account or cross-device sync. Source downloads include corresponding backend source. Hosting and a running model are still required for public AI access.

### Immersive solar background

One lazy-loaded Three.js scene stays mounted behind the permanently dark chat. Explore mode makes the chat inert and fades it out without destroying the form, draft, chart, or stream. Escape or Return to Chat restores focus. OrbitControls supports mouse orbit/pan/wheel and touch rotate/pinch/pan. Click a planet or use the keyboard-accessible navigator to fly toward it and follow its orbit. Dragging cancels the camera flight; Reset View returns to the system overview.

Planets use local 2K maps with axial rotation, a tilted ring plane for Saturn, Earth atmospheric glow, point-source sunlight, desktop Explore shadows, and a lightweight Sun corona. Dimensions and circular orbits are deliberately compressed and motion accelerated independently; this visual experience is **not an ephemeris** and never supplies chart or AI data. Venus uses a surface map rather than its cloud layer.

Rendering is capped at roughly 30 fps in chat and up to 60 fps in Explore, with capped pixel ratio, no per-frame Angular updates, pause controls, reduced-motion support, and hidden-tab suspension. On mobile, point-light shadow maps are disabled. WebGL failure leaves the chat usable. Geometry, textures, controls, events, observers, and animation frames are disposed on destruction.

Textures: Solar System Scope / INOVE, CC BY 4.0, via the pinned mirror recorded in `public/textures/ATTRIBUTION.md`. Planet facts link to the NASA fact sheet; moon counts are explicitly a source snapshot, not current discovery totals. Three.js / OrbitControls are MIT licensed. No new backend dependency.
