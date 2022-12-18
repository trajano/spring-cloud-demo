import { useEffect, useReducer, useRef, useState } from 'react';
import { AuthState } from '..';
import type { TokenCheckClockState } from './TokenCheckClockState';
import { updatePerSecondReducer } from './updatePerSecondReducer';

/**
 * This is a hook that provides a state that updates forcing a render.
 * It triggers on the following conditions:
 * 1. if BACKEND_FAILURE it creates a timeout that does a state change in timeoutForBackendFailureCheck
 * 2. if AUTHENTICATED it creates a timeout of the minimum of maxTimeoutForRefreshCheck and tokenExpiresAt - now - timeBeforeExpirationRefresh
 * 3. if any of the remaining states INITIAL or NEEDS_REFRESH or UNAUTHENTICATED or BACKEND_INACCESSIBLE then no timeout updates, basically deactivated
 * @param authState current auth state
 * @param tokenExpiresAt when does the token expire may be undefined
 * @param timeBeforeExpirationRefresh Time in seconds to consider refreshing the access token.  Defaults to 10.
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
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    function handleTimeout() {
      updateLastCheckTime(Date.now());
      if (authState === AuthState.BACKEND_FAILURE) {
        timerRef.current = setTimeout(
          handleTimeout,
          timeoutForBackendFailureCheck
        );
      } else if (authState === AuthState.AUTHENTICATED && tokenExpiresAt) {
        const nextTimeout = Math.min(
          maxTimeoutForRefreshCheck,
          tokenExpiresAt.getTime() -
            Date.now() -
            timeBeforeExpirationRefresh * 1000
        );
        console.log({ nextTimeout, now: Date.now() });
        if (nextTimeout > 0) {
          timerRef.current = setTimeout(handleTimeout, nextTimeout);
        }
      }
    }
    handleTimeout();
    return () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [
    authState,
    tokenExpiresAt,
    timeBeforeExpirationRefresh,
    maxTimeoutForRefreshCheck,
    timeoutForBackendFailureCheck,
  ]);
  return {
    lastCheckTime,
  };
}
