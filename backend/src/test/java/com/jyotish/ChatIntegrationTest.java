package com.jyotish;

import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatIntegrationTest {
    static final AtomicReference<String> received = new AtomicReference<>("");
    static final AtomicInteger status = new AtomicInteger(200);
    static volatile CountDownLatch finishStream = new CountDownLatch(0);
    static final HttpServer mock;
    static {
        try {
            mock = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            mock.createContext("/api/chat", exchange -> {
                received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                if (received.get().contains("\"stream\":true") && status.get() == 200) {
                    exchange.getResponseHeaders().set("Content-Type", "application/x-ndjson");
                    exchange.sendResponseHeaders(200, 0);
                    var output = exchange.getResponseBody();
                    output.write("{\"message\":{\"content\":\"Moon \"},\"done\":false}\n".getBytes(StandardCharsets.UTF_8));
                    output.flush();
                    try { finishStream.await(5, TimeUnit.SECONDS); }
                    catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    output.write("{\"message\":{\"content\":\"in Libra\"},\"done\":true}\n".getBytes(StandardCharsets.UTF_8));
                    exchange.close();
                    return;
                }
                byte[] body = "{\"message\":{\"content\":\"Test interpretation, not a prediction.\"}}".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(status.get(), body.length);
                exchange.getResponseBody().write(body);
                exchange.close();
            });
            mock.start();
        } catch (Exception error) { throw new RuntimeException(error); }
    }
    @DynamicPropertySource static void properties(DynamicPropertyRegistry properties) {
        properties.add("ollama.url", () -> "http://127.0.0.1:" + mock.getAddress().getPort());
    }
    @LocalServerPort int port;
    @AfterAll static void stop() { mock.stop(0); }
    HttpResponse<String> post(String body) throws Exception {
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/chat"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }
    static final String VALID = "{\"chart\":\"{Moon: Libra}\",\"messages\":[{\"role\":\"user\",\"content\":\"Explain my chart\"}]}";
    @Test void forwardsChartWithServerOwnedInstructions() throws Exception {
        var response = post(VALID);
        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("Test interpretation"));
        assertTrue(received.get().contains("Never invent"));
        assertTrue(received.get().contains("conditional forecasts"));
        assertTrue(received.get().contains("A dasha boundary is not an event date"));
        assertTrue(received.get().contains("Moon: Libra"));
        assertTrue(received.get().contains("\"stream\":false"));
    }
    @Test void rejectsSystemRolesAndEmptyMessages() throws Exception {
        assertEquals(400, post(VALID.replace("\"user\"", "\"system\"")).statusCode());
        assertEquals(400, post("{\"chart\":\"{}\",\"messages\":[]}").statusCode());
    }
    @Test void rejectsNullTurn() throws Exception {
        assertEquals(400, post("{\"chart\":\"{}\",\"messages\":[null]}").statusCode());
    }
    @Test void rejectsOversizedBody() throws Exception {
        assertEquals(413, post("x".repeat(65537)).statusCode());
    }
    @Test void upstreamFailureDoesNotExposeDetails() throws Exception {
        status.set(500);
        try {
            var response = post(VALID);
            assertEquals(503, response.statusCode());
            assertFalse(response.body().contains("Test interpretation"));
        } finally { status.set(200); }
    }
    @Test void rateLimitExpiresAndSeparatesPeers() {
        var limits = new RequestLimits();
        for (int i=0; i<10; i++) assertTrue(limits.allow("one", 0));
        assertFalse(limits.allow("one", 1));
        assertTrue(limits.allow("two", 1));
        assertTrue(limits.allow("one", 60000));
    }
    @Test void rejectsUnapprovedBrowserOrigin() throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/chat"))
                .header("Origin", "https://unapproved.example").header("Access-Control-Request-Method", "POST")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build();
        assertEquals(403, HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofString()).statusCode());
    }
    @Test void streamsFirstTokenBeforeUpstreamFinishesAndPreservesFollowUp() throws Exception {
        finishStream = new CountDownLatch(1);
        var body = "{\"chart\":\"Moon: Libra\",\"messages\":[{\"role\":\"user\",\"content\":\"My career?\"},{\"role\":\"assistant\",\"content\":\"A traditional reading.\"},{\"role\":\"user\",\"content\":\"Why?\"}]}";
        var request = HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/chat/stream"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
        try (var responseBody = HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofInputStream()).body();
             var reader = new BufferedReader(new InputStreamReader(responseBody, StandardCharsets.UTF_8))) {
            assertEquals("{\"token\":\"Moon \"}", reader.readLine());
            assertEquals(1, finishStream.getCount());
            assertTrue(received.get().contains("Why?"));
            assertTrue(received.get().contains("My career?"));
            finishStream.countDown();
            assertEquals("{\"token\":\"in Libra\"}", reader.readLine());
            assertEquals("{\"done\":true}", reader.readLine());
        } finally { finishStream.countDown(); }
    }
    @Test void streamingUpstreamFailureHasNoFalseCompletion() throws Exception {
        status.set(500);
        try {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/chat/stream"))
                    .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(VALID)).build();
            var response = HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofString());
            assertEquals(503,response.statusCode());
            assertTrue(response.body().contains("error"));
            assertFalse(response.body().contains("done"));
        } finally { status.set(200); }
    }

}
