package com.knowledgeshare.evidence.driver;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Mirrors the upstream {@code DriverManagerTest} in cucumberBDDParallel — proves the blog
 * claim that parallel threads do not share the same browser session when ThreadLocal is used.
 */
class DriverManagerTest {

    @AfterEach
    void tearDown() {
        DriverManager.clear();
    }

    @Test
    void throwsWhenNothingHasBeenSetOnThisThread() {
        assertThrows(IllegalStateException.class, DriverManager::get);
    }

    @Test
    void getReturnsWhatWasSetOnTheSameThread() {
        DriverManager.BrowserSession session = () -> "main";

        DriverManager.set(session);

        assertSame(session, DriverManager.get());
    }

    @Test
    void differentThreadsSeeDifferentSessions() throws InterruptedException {
        DriverManager.BrowserSession mainSession = () -> "main";
        DriverManager.set(mainSession);

        AtomicReference<DriverManager.BrowserSession> otherSession = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        Thread other = new Thread(() -> {
            DriverManager.BrowserSession session = () -> "other";
            DriverManager.set(session);
            otherSession.set(DriverManager.get());
            done.countDown();
        });
        other.start();
        done.await();

        assertNotSame(mainSession, otherSession.get());
        assertSame(mainSession, DriverManager.get());
    }
}