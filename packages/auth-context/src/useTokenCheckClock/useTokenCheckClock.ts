import { useEffect, useReducer, useRef } from 'react';
import { AuthState } from '../AuthState';
import type { TokenCheckClockState } from './TokenCheckClockState';
import { updatePerSecondReducer } from './updatePerSecondReducer';

/**
 * This is a hook that provides a state that updates forcing a render.
 * It triggers on the following conditions:
 * 1. if BACKEND_FAILURE  it creates a timeout that does a state change in timeoutForBackendFailureCheck
 * 2. if AUTHENTICATED it creates a timeout of the minimum of maxTimeoutForRefreshCheck and tokenExpiresAt - now - timeBeforeExpirationRefresh
 * 3. if any of the remaining states INITIAL or UNAUTHENTICATED or BACKEND_INACCESSIBLE then no timeout updates, basically deactivated
 * @param authState current auth state
 * @param tokenExpiresAt when does the token expire may be undefined
 * @param timeBeforeExpirationRefresh Time in ms to consider refreshing the access token.  Defaults to 10000.
 * @param maxTimeoutForRefreshCheck maximum timeout in ms for refresh check, defaults to 60000
 * @param timeoutForBackendFailureCheck maximum timeout in ms for check when the backend is failing, defaults to 60000
 */
export function useTokenCheckClock(
  authState: AuthState,
  tokenExpiresAt: Date | undefined | null,
  timeBeforeExpirationRefresh: number,
  maxTimeoutForRefreshCheck = 60000,
  timeoutForBackendFailureCheck = 60000
): TokenCheckClockState {
  const [lastCheckTime, updateLastCheckTime] = useReducer(
    updatePerSecondReducer,
    Math.ceil(Date.now() / 1000) * 1000
  );
  /**
   * Forces a rerender.
   */
  const [timesForced, forceCheck] = useReducer((prev) => prev + 1, 0);

  const nextCheckTimeRef = useRef<number | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function handleTimeout() {
      if (authState === AuthState.BACKEND_FAILURE) {
        const nextCheckTimeout =
          timeoutForBackendFailureCheck - (Date.now() % 1000);
        nextCheckTimeRef.current = Date.now() + nextCheckTimeout;
        timer = setTimeout(handleTimeout, nextCheckTimeout);
      } else if (authState === AuthState.AUTHENTICATED && tokenExpiresAt) {
        const nextCheckTimeout =
          Math.min(
            maxTimeoutForRefreshCheck,
            tokenExpiresAt.getTime() - Date.now() - timeBeforeExpirationRefresh
          ) -
          (Date.now() % 1000);
        if (nextCheckTimeout > 0) {
          timer = setTimeout(handleTimeout, nextCheckTimeout);
          nextCheckTimeRef.current = Date.now() + nextCheckTimeout;
        } else {
          nextCheckTimeRef.current = null;
        }
      } else {
        nextCheckTimeRef.current = null;
      }
      updateLastCheckTime(Date.now());
    }
    handleTimeout();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    authState,
    tokenExpiresAt,
    timeBeforeExpirationRefresh,
    maxTimeoutForRefreshCheck,
    timeoutForBackendFailureCheck,
    timesForced,
  ]);
  return {
    lastCheckTime,
    nextCheckTime: nextCheckTimeRef.current,
    forceCheck,
  };
}
