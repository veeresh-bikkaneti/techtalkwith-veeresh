package com.knowledgeshare.evidence.driver;

/**
 * Minimal stand-in for the pattern described in the blog post and implemented in
 * <a href="https://github.com/veeresh-bikkaneti/cucumberBDDParallel">cucumberBDDParallel</a>.
 * Uses a marker interface instead of Selenium so this evidence module runs without a browser.
 */
public final class DriverManager {

    public interface BrowserSession {
        String id();
    }

    private static final ThreadLocal<BrowserSession> SESSION = new ThreadLocal<>();

    private DriverManager() {
    }

    public static BrowserSession get() {
        BrowserSession session = SESSION.get();
        if (session == null) {
            throw new IllegalStateException("No WebDriver set up for this thread");
        }
        return session;
    }

    public static void set(BrowserSession session) {
        SESSION.set(session);
    }

    public static void clear() {
        SESSION.remove();
    }
}