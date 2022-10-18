import { useEffect, useRef } from "react";
/**
 * @param predicate an async function that if false will skip the callback, but will still poll.
 * @param asyncFunction
 * @param interval milliseconds between calls to the asyncFunction, defaults to a minute
 * @param immediate if true it will run the asyncFunction immediately before looping
 *
 */
export function usePollingIf<T = unknown>(
  predicate: () => boolean | PromiseLike<boolean>,
  asyncFunction: () => T | PromiseLike<T>,
  interval = 60000,
  immediate = true
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(false);
  const activeRef = useRef(false);

  async function wrappedAsyncFunction(): Promise<void> {
    if (!mountedRef.current || activeRef.current) {
      // don't process if currently active or the component is unmounted
      return;
    }
    if (await predicate()) {
      activeRef.current = true;
      try {
        await asyncFunction();
      } catch (e) {
        console.error("Error while polling", e);
      } finally {
        activeRef.current = false;
      }
    }
    timeoutRef.current = setTimeout(wrappedAsyncFunction, interval);
  }

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      wrappedAsyncFunction();
    } else {
      timeoutRef.current = setTimeout(wrappedAsyncFunction, interval);
    }
    return () => {
      clearTimeout(timeoutRef.current);
      mountedRef.current = false;
      activeRef.current = false;
    };
  }, []);
}