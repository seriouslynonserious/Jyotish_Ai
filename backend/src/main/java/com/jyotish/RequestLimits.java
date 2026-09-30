package com.jyotish;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.HashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestLimits extends OncePerRequestFilter {
    private record Window(long start, int count) {}
    private final HashMap<String, Window> windows = new HashMap<>();

    // Direct peer address only. A production gateway should enforce its own per-user/IP limits.
    synchronized boolean allow(String ip, long now) {
        windows.entrySet().removeIf(entry -> now - entry.getValue().start() >= 60000);
        var previous = windows.get(ip);
        if (previous != null && previous.count() >= 10) return false;
        if (previous == null && windows.size() >= 10000) return false;
        windows.put(ip, previous == null ? new Window(now, 1) : new Window(previous.start(), previous.count() + 1));
        return true;
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                              FilterChain chain) throws ServletException, IOException {
        if (!(request.getRequestURI().equals("/api/chat") || request.getRequestURI().equals("/api/chat/stream")) || !request.getMethod().equals("POST")) {
            chain.doFilter(request, response); return;
        }
        if (!allow(request.getRemoteAddr(), System.currentTimeMillis())) {
            response.setHeader("Retry-After", "60"); response.sendError(429); return;
        }
        byte[] bytes = request.getInputStream().readNBytes(65537);
        if (bytes.length > 65536) { response.sendError(413); return; }
        var input = new ByteArrayInputStream(bytes);
        var wrapped = new HttpServletRequestWrapper(request) {
            @Override public ServletInputStream getInputStream() {
                return new ServletInputStream() {
                    public int read() { return input.read(); }
                    public boolean isFinished() { return input.available() == 0; }
                    public boolean isReady() { return true; }
                    public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException(); }
                };
            }
        };
        chain.doFilter(wrapped, response);
    }
}
