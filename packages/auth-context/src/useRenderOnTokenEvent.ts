import type {
  NetInfoState
} from '@react-native-community/netinfo';
import { differenceInMilliseconds } from 'date-fns';
import {
  useCallback,
  useEffect,
  useMemo, useRef,
  useState
} from 'react';
import type { EndpointConfiguration } from './EndpointConfiguration';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import { useNetInfoState } from './useNetInfoState';

type RenderOnTokenEventState = {
  /**
   * Token is refreshable
   */
  tokenRefreshable: boolean;
  /**
   * Last time the token was checked.
   */
  lastCheckTime: number;
  /**
   * Net info state.
   */
  netInfoState: NetInfoState;
};
/**
 * A hook that will rerender a component using this hook when:
 * - app state changes,
 * - network state changes
 * - token needs to be rechecked.
 * @param endpointConfiguration to obtain the ping URL
 * @param tokenExpiresAt when does the token expire
 * @param timeBeforeExpirationRefresh Time in seconds to consider refreshing the access token.  Defaults to 10.
 */
export function useRenderOnTokenEvent(
  endpointConfiguration: EndpointConfiguration,
  tokenExpiresAt: Date,
  timeBeforeExpirationRefresh: number
): RenderOnTokenEventState {
  /**
   * Last time the auth token was checked for expiration
   */
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  /**
   * App State
   */
  const appState = useAppStateWithNetInfoRefresh();

  /**
   * Expiration timeout ID ref.  This is a timeout that executes when the OAuth timeout is less than X (default to 10) seconds away from expiration.
   * When it reaches the expiration it will set the state to NEEDS_REFRESH.
   * The timeout is cleared on unmount, logout or refresh.
   */
  const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const clearExpirationTimeout = useCallback(() => {
    clearTimeout(expirationTimeoutRef.current);
    expirationTimeoutRef.current = undefined;
  }, [expirationTimeoutRef]);

  /**
   * Net info state.
   */
  const netInfoState = useNetInfoState(
    endpointConfiguration,
    clearExpirationTimeout
  );

  /**
   * Token is refreshable if the app is active, there's a connection and the backend is reachable.
   */
  const tokenRefreshable = useMemo<boolean>(
    () =>
      appState === 'active' &&
      !!netInfoState.isConnected &&
      !!netInfoState.isInternetReachable,
    [appState, netInfoState.isConnected, !!netInfoState.isInternetReachable]
  );

  useEffect(
    /**
     * Updates last check time.  It will do it every 60 seconds (which is a requirement for Android) or
     * less if it is going to expire in less than 60 seconds.  It will not create another timeout if
     * the token has already expired.
     */
    function updateLastCheckTime() {
      setLastCheckTime(Date.now());
      const nextCheckInMs = Math.min(
        60000,
        differenceInMilliseconds(Date.now(), tokenExpiresAt) -
          timeBeforeExpirationRefresh * 1000
      );
      if (nextCheckInMs > 0) {
        // reset the timeout if not expired yet.
        setTimeout(updateLastCheckTime, nextCheckInMs);
      } else {
        expirationTimeoutRef.current = undefined;
      }
      return () => clearExpirationTimeout();
    },
    [tokenExpiresAt]
  );

  return {
    tokenRefreshable,
    lastCheckTime,
    netInfoState,
  };
}
