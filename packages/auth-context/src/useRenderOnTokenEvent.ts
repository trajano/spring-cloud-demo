import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';
import { differenceInMilliseconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { EndpointConfiguration } from './EndpointConfiguration';

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
): { tokenRefreshable: boolean; lastCheckTime: number } {
  /**
   * Last time the auth token was checked for expiration
   */
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  /**
   * App State
   */
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  /**
   * Net info state.
   */
  const [netInfoState, setNetInfoState] = useState<NetInfoState>({
    type: NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null,
  });

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

  useEffect(
    /**
     * Monitors app state changes.
     */
    function appStateSubscription() {
      const appStateSubscription = AppState.addEventListener(
        'change',
        (nextAppState) => {
          if (nextAppState === 'active') {
            // if the app switches to active, force a NetInfo refresh
            NetInfo.refresh();
          }
          setAppState(nextAppState);
        }
      );
      return () => {
        appStateSubscription.remove();
      };
    },
    []
  );

  useEffect(
    /**
     * Monitors network state changes.
     */
    function netInfoSubscription() {
      NetInfo.configure({
        reachabilityUrl: endpointConfiguration.pingEndpoint.href,
        reachabilityTest: (response) =>
          Promise.resolve(response.status === 200 || response.status === 204),
        useNativeReachability: true,
      });

      const unsubscribeNetInfo = NetInfo.addEventListener(
        (nextNetInfoState) => {
          setNetInfoState(nextNetInfoState);
        }
      );

      NetInfo.refresh().then((nextNetInfoState) => {
        setNetInfoState(nextNetInfoState);
      });
      return () => {
        unsubscribeNetInfo();
        clearExpirationTimeout();
      };
    },
    [endpointConfiguration]
  );

  return {
    tokenRefreshable,
    lastCheckTime,
  };
}
