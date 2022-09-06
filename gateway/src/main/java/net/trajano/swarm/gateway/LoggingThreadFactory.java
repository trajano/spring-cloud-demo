package net.trajano.swarm.gateway;

import java.util.concurrent.ThreadFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class LoggingThreadFactory implements ThreadFactory {

  private final ThreadFactory delegate;

  @Override
  public Thread newThread(Runnable r) {

    return delegate.newThread(new LoggingRunnable(r));
  }

  @RequiredArgsConstructor
  static class LoggingRunnable implements Runnable {
    private final Runnable runnableDelegate;

    @Override
    public void run() {
      final long start = System.currentTimeMillis();
      try {
        runnableDelegate.run();
      } finally {
        final var time = System.currentTimeMillis() - start;
        if (time > 1000) {
          log.error("{} took {} ms", runnableDelegate, time);
        }
      }
    }
  }
}
