# Jyotish AI — Phase 1

A simple Angular frontend with local demo chat. No backend, APIs, astrology calculations, accounts, payments, or storage.

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

## Astrology foundation

`src/app/core/astrology/` contains pure utilities plus an injectable service. All longitude inputs must already be sidereal degrees; the utilities normalize finite values into `[0, 360)`. Invalid values (`NaN` or infinity) throw `RangeError`.

```typescript
import { testLongitude } from './app/core/astrology/astrology.dev';

const longitude = 311.5;
const result = testLongitude(longitude);
console.log(result);
```

`AstrologyEngineService.describeLongitude()` returns longitude, zodiac sign, degree within the sign, nakshatra, and pada. `ketuFromRahu()` returns the same structure for the opposite longitude. `calculateBirthChart()` accepts `dateOfBirth`, `timeOfBirth`, and `placeOfBirth` and returns `Not calculated yet`. There was no birth-profile model in this checkout; the new interface provides this contract without adding a form or inventing positions.

Run `npm test` for all 151 boundary and utility tests. No test dependencies were added. Nakshatra/pada boundaries use `boundary * 360 / 108`; values immediately below a boundary belong to the preceding interval.

The header toggles dark mode for the current session. Refresh returns to the original light theme.
