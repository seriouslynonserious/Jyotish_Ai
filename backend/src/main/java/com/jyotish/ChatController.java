package com.jyotish;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.Semaphore;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ChatController {
    private final OllamaClient ollama;
    private final Semaphore capacity = new Semaphore(2);
    public ChatController(OllamaClient ollama) { this.ollama = ollama; }

    @PostMapping("/api/chat")
    public Map<String, String> chat(@Valid @RequestBody ChatRequest request) {
        if (!request.messages().getLast().role().equals("user")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (!capacity.tryAcquire()) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        try {
            return Map.of("reply", ollama.reply(request));
        } catch (Exception error) {
            // Never expose upstream response bodies, prompts, or infrastructure details.
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        } finally { capacity.release(); }
    }

    @PostMapping(value = "/api/chat/stream", produces = "application/x-ndjson")
    public void stream(@Valid @RequestBody ChatRequest request, HttpServletResponse response) throws IOException {
        if (!request.messages().getLast().role().equals("user")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (!capacity.tryAcquire()) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        response.setContentType("application/x-ndjson");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Accel-Buffering", "no");
        try {
            ollama.stream(request, response.getOutputStream());
        } catch (Exception error) {
            if (!response.isCommitted()) response.setStatus(503);
            ollama.writeEvent(response.getOutputStream(), Map.of("error", "AI response interrupted. Please try again."));
        } finally { capacity.release(); }
    }

    @GetMapping("/api/health")
    public Map<String, String> health() { return Map.of("status", "up"); }
}
