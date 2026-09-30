# Jyotish AI chat backend

Java 21, Spring Boot 4.1.1 and Maven 3.9+. No database, accounts, or server-side conversation storage. Project license: AGPL-3.0-or-later. Spring Boot is Apache-2.0; Ollama is MIT; model licenses are separate.

## Local startup

1. Install Ollama from https://ollama.com and run `ollama pull llama3.2:3b` (a model download, with its own license). Start Ollama with `ollama serve` if the application is not already running.
2. In `backend`, run `mvn spring-boot:run`.
3. In `frontend`, run `npm install` and `npm start`. Restart an already-running Angular server to load `proxy.conf.json`.
4. Open http://localhost:4200, calculate a chart, then send a question. `/api` proxies to Spring Boot on port 8080.

Configuration: `OLLAMA_URL` (default http://127.0.0.1:11434), `OLLAMA_MODEL` (llama3.2:3b), `OLLAMA_TIMEOUT_SECONDS` (90), `APP_ALLOWED_ORIGIN` (http://localhost:4200), `PORT` (8080). Keep Ollama private; the frontend never selects the upstream URL or model.

## Container startup

From the repository root:

```sh
docker compose up -d --build
docker compose exec ollama ollama pull llama3.2:3b
```

Open http://localhost:8088. This CPU configuration is for local verification; model responses may be slow. No model is downloaded during the image build. GPU device configuration depends on the hosting platform. Nginx forwards `/api` on the same origin. Ollama and the backend have no public ports in this configuration.

For public hosting, deploy on a suitable model-serving host, put HTTPS in front of the frontend, set the correct allowed origin, and apply gateway request/body/connection limits. The checked-in binding is localhost-only, not a live public deployment. Per-IP app throttling uses direct peers; behind Nginx it conservatively shares a bucket. Add trusted gateway rate limiting before scaling; do not blindly trust client-supplied forwarding headers. CORS is not authentication. No paid service or hosting account has been configured.

## API and privacy

`POST /api/chat` takes `{chart: string, messages: [{role: "user"|"assistant", content: string}]}` and returns `{reply: string}`. The compatibility endpoint returns a complete response. The UI uses `POST /api/chat/stream`, which accepts the same request and streams newline-delimited `{token: string}` events followed by `{done: true}`. An `{error: string}` event means the answer is incomplete. At most 12 turns, 2,000 characters per turn, 24,000 chart characters, 64 KiB body, 10 requests per minute per direct peer, and two concurrent generations. Upstream timeout is 90 seconds. API returns 400/413/429/503 for invalid/large/busy/unavailable requests. GET `/api/health` reports backend availability, not model readiness.

The chart is supplied by the browser and is not independently recomputed or trusted by the server. System guidance prohibits invented fields and guaranteed outcomes, but model compliance is not guaranteed. Responses render as escaped plain text. Birth labels and coordinates are not separately submitted; the calculated chart and recent chat are sent when the user sends a message. No request bodies are deliberately logged or persisted here; review host/provider logging policies before launch.

Optional browser storage saves the birth profile and most recent 20 messages. It is unencrypted, origin-specific, has no device sync, and can be cleared through the UI. A refresh recalculates the chart from the saved profile. New Chat replaces the saved session if saving is enabled. Turning saving off removes the stored session but retains the current screen; Delete saved data also clears the screen.

## Verification

`mvn test` uses an in-process mock Ollama HTTP server: forwarding, validation, body limits, CORS, upstream errors and rate windows. `mvn package` builds the executable jar. Real model quality/latency still require a running Ollama model.

References: https://docs.ollama.com/api/chat and https://docs.spring.io/spring-boot/system-requirements.html .

## Installed on this workspace

Ollama 0.34.2 CLI is installed in `../work/ollama` relative to the repository root. The official runtime SHA-256 was verified against GitHub's release digest. `llama3.2:3b` is downloaded in the standard `~/.ollama` model folder. Neither the runtime nor model weights are committed to Git.

From the repository root, run `./start-local.sh` to start the existing built backend, local Ollama and Angular on http://127.0.0.1:4204. Keep that terminal open. Existing healthy services are reused. You can override the runtime path with `OLLAMA_BIN`; there is no login-time autostart.

The workspace launcher uses CPU mode (`LLAMA_ARG_DEVICE=none`) because Metal resources are unavailable in the agent environment. Its isolated local ports are Ollama 11435, backend 8081 and Angular 4204. Production/container defaults are unchanged.

## Astrology reading style

The reader answers the question with a traditional interpretation, specific supplied placements, available dasha timing and a practical next step. Simple factual questions remain brief. Predictions are conditional; event dates, guarantees, uncalculated yogas/aspects and transits must not be invented. Planetary house numbers are supplied explicitly. Prompt guidance improves grounding but does not guarantee model accuracy.

House-topic reference: P.V.R. Narasimha Rao, *Vedic Astrology: An Integrated Approach*, house significations: https://vedicastrologer.org/articles/vedic_astro_textbook.pdf . These are traditional associations, not scientifically verified predictions.

After rebuilding the backend, run `./start-local.sh --restart` from the repository root in your Terminal to replace this workspace's old backend/frontend processes. This keeps the local app on port 4204 and reuses Ollama.

## Local streaming chat

Replies appear as the model generates text. Stop response, New Chat, changing the birth profile and leaving the chat cancel the browser request. The backend closes the upstream connection when a disconnected browser is detected on a write; model prefill may continue until its next token or read timeout. Streaming still needs time to read the chart before the first token.

Only complete assistant replies enter saved history and follow-up context. Interrupted text remains visible temporarily but is not saved or submitted as a completed answer. Up to 12 recent turns are sent for follow-ups; the browser saves at most 20 messages when enabled. Changing the birth profile starts fresh history to avoid mixing readings for different charts.

The servlet streams directly with a maximum of two active model calls. Nginx buffering is disabled for API responses. No new inference package, cloud service or account is used.

Streaming references: https://docs.ollama.com/api/streaming and https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html .
