package net.trajano.swarm.gateway;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

public class DelegateScheduleExecutorService implements ScheduledExecutorService {

  final ScheduledExecutorService scheduledExecutorService;

  public DelegateScheduleExecutorService(ScheduledExecutorService service) {

    scheduledExecutorService = service;
  }

  @Override
  public ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit) {

    return scheduledExecutorService.schedule(new LoggingRunnable(command), delay, unit);
  }

  @Override
  public <V> ScheduledFuture<V> schedule(Callable<V> callable, long delay, TimeUnit unit) {

    return scheduledExecutorService.schedule(callable, delay, unit);
  }

  @Override
  public ScheduledFuture<?> scheduleAtFixedRate(
      Runnable command, long initialDelay, long period, TimeUnit unit) {

    return scheduledExecutorService.scheduleAtFixedRate(
        new LoggingRunnable(command), initialDelay, period, unit);
  }

  @Override
  public ScheduledFuture<?> scheduleWithFixedDelay(
      Runnable command, long initialDelay, long delay, TimeUnit unit) {

    return scheduledExecutorService.scheduleWithFixedDelay(
        new LoggingRunnable(command), initialDelay, delay, unit);
  }

  @Override
  public void shutdown() {

    scheduledExecutorService.shutdown();
  }

  @Override
  public List<Runnable> shutdownNow() {

    return scheduledExecutorService.shutdownNow();
  }

  @Override
  public boolean isShutdown() {

    return scheduledExecutorService.isShutdown();
  }

  @Override
  public boolean isTerminated() {

    return scheduledExecutorService.isTerminated();
  }

  @Override
  public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException {

    return scheduledExecutorService.awaitTermination(timeout, unit);
  }

  @Override
  public <T> Future<T> submit(Callable<T> task) {

    return scheduledExecutorService.submit(task);
  }

  @Override
  public <T> Future<T> submit(Runnable task, T result) {

    return scheduledExecutorService.submit(new LoggingRunnable(task), result);
  }

  @Override
  public Future<?> submit(Runnable task) {

    return scheduledExecutorService.submit(new LoggingRunnable(task));
  }

  @Override
  public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
      throws InterruptedException {

    return scheduledExecutorService.invokeAll(tasks);
  }

  @Override
  public <T> List<Future<T>> invokeAll(
      Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit)
      throws InterruptedException {

    return scheduledExecutorService.invokeAll(tasks, timeout, unit);
  }

  @Override
  public <T> T invokeAny(Collection<? extends Callable<T>> tasks)
      throws InterruptedException, ExecutionException {

    return scheduledExecutorService.invokeAny(tasks);
  }

  @Override
  public <T> T invokeAny(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit)
      throws InterruptedException, ExecutionException, TimeoutException {

    return scheduledExecutorService.invokeAny(tasks, timeout, unit);
  }

  @Override
  public void execute(Runnable command) {

    scheduledExecutorService.execute(new LoggingRunnable(command));
  }

  @Slf4j
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
          log.error("runnable {} took {} ms", runnableDelegate, time);
        }
      }
    }
  }

  @RequiredArgsConstructor
  @Slf4j
  static class LoggingCallable<T> implements Callable<T> {
    private final Callable<T> runnableDelegate;

    @Override
    public T call() throws Exception {

      final long start = System.currentTimeMillis();
      try {
        return runnableDelegate.call();
      } finally {
        final var time = System.currentTimeMillis() - start;
        if (time > 1000) {
          log.error("callable {} took {} ms", runnableDelegate, time);
        }
      }
    }
  }
}
