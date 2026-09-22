# Jyotish AI

An Angular frontend with local birth-chart calculations and city search. No backend, accounts, payments, predictions, or persistent birth-data storage.

## Run

```bash
npm install
npm start
```

Open http://localhost:4200. Build for production with `npm run build`.

## Read the code

- `src/app/core/models/chat-message.model.ts`: typed message shape.
- `src/app/features/chat/chat-layout/`: messages, simulated reply, reset, responsive layout.
- `src/app/features/chat/sidebar/`: navigation and static demo history.
- `src/app/features/chat/chat-input/`: draft, keyboard handling, send, suggestions.
- `src/app/features/chat/message/`: user and assistant rendering.
- `src/app/app.routes.ts`: root route.
- `src/styles.css`: shared colors, interactions, reduced-motion support.

Enter sends, Shift+Enter adds a newline. While a reply is pending, sending is disabled. New Chat cancels a pending reply and clears the conversation. Chats are lost on refresh. Recent entries are illustrative labels. Settings explains the preview behavior.

Angular disk caching is disabled to avoid a native cache crash on this machine. The dev server uses polling to avoid file-watcher limits.

## Astronomy engine

- `@kuntay/swisseph` 0.2.2: AGPL-3.0-or-later, wrapping Swiss Ephemeris 2.10.03 in browser WASM. Source: https://github.com/kuntayerkus/swisseph-wasm/tree/v0.2.2
- `@js-temporal/polyfill` 0.5.1: ISC. Source: https://github.com/js-temporal/temporal-polyfill
- The application is distributed under AGPL-3.0-or-later. See LICENSE and THIRD_PARTY_NOTICES.md. Build/start regenerate the downloadable corresponding-source archive; preserve the source links when deploying.

`AstrologyEngineService.calculateBirthChart(data)` accepts birth date/time, coordinates and IANA timezone. `EphemerisService` isolates the asynchronous WASM loader and all Swiss calls. The unmodified package ESM/WASM assets are copied to `vendor/swisseph`; no CDN or external ephemeris files are required.

Supported UTC years: 1700–2100. Both tropical and sidereal apparent geocentric longitudes come from the same built-in Moshier model. UTC is converted to UT1/TT using Swiss Ephemeris. Sidereal mode is standard Lahiri/Chitrapaksha (1), not True Citra (27). The displayed date-specific ayanamsha includes nutation to match the tropical-to-sidereal difference. Full precision is retained internally.

Sun, Moon, Mercury, Venus, Mars, Jupiter and Saturn have tropical/sidereal longitudes and Vedic signs/degrees. Moon nakshatra/pada uses only sidereal longitude. Rahu uses MEAN_NODE; Ketu is exactly opposite. Coordinates affect Lagna/houses but do not affect geocentric planet positions. Moshier is not the full Swiss/JPL data-file model. Lahiri Lagna and whole-sign houses use the birth coordinates. Vimshottari Mahadasha/Antardasha dates use an explicitly labeled 365.25-day year. Transits and interpretations are not implemented.

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

Choose **Enter birth details** or send a question. The form asks for date, time, place label, coordinates, and IANA timezone. Calculate positions shows tropical and Lahiri sidereal results for seven planets plus Rahu/Ketu, ayanamsha and Moon nakshatra/pada. Edit birth details recalculates; Cancel keeps the previous result. New Chat clears all profile/results and messages. Input and calculation failures preserve the form. Nothing is saved to localStorage. Only the typed place name is sent to the location provider; date and birth time stay local.

The chat route is lazy-loaded to keep astronomy dependencies out of the initial bundle. Temporal's known JSBI CommonJS dependency is explicitly allowed in the Angular build configuration.

## Birthplace lookup

Type a city/town and click **Find birthplace**, then choose the correct region/country. Open-Meteo's Geocoding API (GeoNames data) supplies latitude, longitude, and IANA timezone. No package or API key is needed. Editing the place clears old coordinates to prevent mismatched locations. Manual entry remains available when search fails. Searches time out after 10 seconds.

Provider documentation and attribution: https://open-meteo.com/en/docs/geocoding-api . The hosted free API is for non-commercial use; commercial deployment requires reviewing the provider's terms. City coordinates represent the matched settlement, not an exact hospital/street address.

## Frontend calculation foundation

The existing result includes expandable whole-sign house placements and nine Vimshottari Mahadashas, each with nine Antardashas. The first major period starts before birth when part of the Moon's nakshatra has elapsed; its subperiods retain their original start dates. The timeline spans one complete cycle from that major-period start. All period dates are UTC and end-exclusive. These are calculated periods, not event predictions.

Pure `house.util.ts` and `dasha.util.ts` keep the arithmetic separate from Angular and Swiss Ephemeris. Lagna is calculated by Swiss Ephemeris's sidereal house API with Lahiri mode. Houses for latitudes at or beyond 66° north/south remain explicitly unavailable in this version; other chart fields still work.

No new dependencies or backend were added. Accounts, cross-device saving, hosted AI and payments remain outside this frontend phase. Reference rules and test conventions are in `tests/fixtures/README.md`.
