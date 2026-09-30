# Public hosting preparation

This configuration is prepared, not deployed. It requires a Linux Docker host and a public domain. CPU-only inference is the default; GPU support must be configured for the chosen host before expecting responsive multi-user chat. No account, billing, DNS, firewall or cloud resources have been created.

1. Point the domain's A record to the host (and AAAA only if IPv6 is configured). Allow inbound 80/443; keep Ollama and the backend private.
2. Install Docker Engine + Compose. Clone or upload the full repository source before building.
3. Export `APP_DOMAIN=your.actual.domain` and optionally `OLLAMA_MODEL=llama3.2:3b` in the deployment shell.
4. Run `docker compose -f compose.public.yaml up -d --build`.
5. Run `docker compose -f compose.public.yaml exec ollama ollama pull llama3.2:3b` (use the configured model if changed).
6. Check `https://your.actual.domain/api/health`, then calculate a synthetic chart and obtain a real AI reply in the browser. Backend health alone does not establish model readiness.

Caddy obtains and renews HTTPS certificates when domain routing and ports are correct. Keep its data volume. See https://caddyserver.com/docs/automatic-https and https://docs.ollama.com/docker .

Current limits: two concurrent generations; backend throttling is conservatively shared behind the proxy. Configure trusted client-aware gateway limits for a larger audience. There are no user accounts. Saved browser data does not automatically transfer from localhost to the public domain. Model outputs are traditional interpretations and can be wrong; review live examples before sharing widely.

The server's Docker runtime, HTTPS certificates and real inference must still be checked on the selected host. Compose configuration validation alone is not a deployment test. Do not expose 8080/11434 directly. Preserve the app's source-download links and the AGPL corresponding source when publishing.
