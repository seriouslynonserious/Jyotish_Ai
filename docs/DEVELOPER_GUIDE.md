# How the project works

## Three parts

1. **Angular frontend** collects birth details and calculates the chart in the browser.
2. **Spring Boot backend** forwards chart information and chat history to Ollama.
3. **Ollama** runs the language model locally and generates the interpretation.

No database or account system is used. Browser storage is optional. The background solar system is a separate visual feature; it never supplies astrology calculations.

## Main folders

| Folder | Purpose |
| --- | --- |
| `frontend/src/app/core/astrology` | Birth-chart calculations and pure utilities |
| `frontend/src/app/core/chat` | AI requests, streaming, chart context, browser storage |
| `frontend/src/app/features/chat/chat-layout` | Birth form → kundli → questions flow |
| `frontend/src/app/features/chat/solar-system` | Three.js scene, camera controls, planet facts |
| `frontend/src/app/features/chat/bot-avatar` | Tara's animated face |
| `frontend/public/textures` | Locally served planet maps and their credits |
| `backend/src/main/java/com/jyotish` | API, Ollama connection, validation, request limits |
| `deploy` | Optional hosting preparation, not a live deployment |

## Local addresses

| Service | Address |
| --- | --- |
| App | http://127.0.0.1:4204 |
| Backend | http://127.0.0.1:8081 |
| Ollama | http://127.0.0.1:11435 |

These are the launcher settings. Running the individual services without the launcher uses different defaults; see the backend README.

## Build and test

From the repository root:

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
mvn -f backend/pom.xml package
```

`npm test` covers calculation boundaries, reference fixtures, saved-session validation, chart context, and stream parsing. Backend tests use a mock Ollama server, so they do not need a downloaded model. A real AI check still requires Ollama.

Recent verification: 308 frontend tests and 9 backend integration tests passed. The production build passed. Browser checks covered planet focusing, camera dragging, zoom, hidden information, mobile layout, and retaining a form draft when returning from Explore.

## Changing the code

- Change topic buttons in `chat-input.component.ts`.
- Change the AI instructions in backend `OllamaClient.java`.
- Change the scene in `solar-scene.ts`; change factual labels in `planet-data.ts` and update source dates.
- Change shared colors and the glass overlay in `frontend/src/styles.css`.

Rebuild the backend after Java changes and restart it. The local frontend normally reloads after frontend changes. Build/start also regenerate the downloadable source archives required for distribution.

## Limits to remember

The chart supports Lahiri positions, mean Rahu/Ketu, whole-sign houses, and Vimshottari periods. It does not calculate transits. The AI is not guaranteed to follow its instructions or interpret correctly.

Explore uses compressed distances, enlarged planets, and independently accelerated motion. It is not a physics or ephemeris engine. It renders less frequently behind chat, pauses in hidden tabs, supports reduced motion, and releases graphics resources when destroyed.

Do not commit model weights, passwords, personal birth files, logs, `.env` files, or build folders. Public hosting is prepared only; no server/domain is configured.
